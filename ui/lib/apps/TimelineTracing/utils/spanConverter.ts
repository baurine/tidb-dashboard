import { TraceQueryTraceResponse, TraceSpan } from '@lib/client'
// import * as d3 from 'd3'

// for test
import testData from './test-data.json'

interface IFullSpan extends TraceSpan {
  node_type: string
  children: IFullSpan[]

  //
  end_unix_time_ns: number
  max_end_time_ns: number // include children span
  height: number // max chilren layers, leaf node which has no children is 0
  depth: number // in which layer, rootSpan is 0
}

export function genFlameGraph(source: TraceQueryTraceResponse): IFullSpan {
  // step 1: flatten the spans
  const allSpans: IFullSpan[] = []
  source.span_sets?.forEach((spanSet) => {
    spanSet.spans?.forEach((span) => {
      allSpans.push({
        ...span,

        node_type: spanSet.node_type!,
        children: [],

        end_unix_time_ns: 0,
        max_end_time_ns: 0,
        height: 0,
        depth: 0,
      })
    })
  })
  // sort, can't sort it by span_id
  allSpans.sort((a, b) => a.begin_unix_time_ns! - b.begin_unix_time_ns!)
  console.log('all spans:', allSpans)

  // step 2: iterator, to build a tree
  const rootSpan = allSpans.find((span) => span.parent_id === 0)!
  const startTime = rootSpan.begin_unix_time_ns!
  allSpans.forEach((span) => {
    span.begin_unix_time_ns = span.begin_unix_time_ns! - startTime
    span.end_unix_time_ns = span.begin_unix_time_ns + span.duration_ns!
  })
  findChildren(rootSpan, allSpans)
  console.log('rootNode:', rootSpan)
  // const root = d3.hierarchy(rootSpan)
  // console.log('root:', root)

  calcMaxEndTime(rootSpan)
  console.log('rootNode after calcMaxTime', rootSpan)

  calcHeight(rootSpan)
  console.log('rootNode after calcHeight', rootSpan)

  calcDepth(rootSpan)
  console.log('rootNode after calcDepth', rootSpan)

  return rootSpan
}

function findChildren(parentSpan: IFullSpan, allSpans: IFullSpan[]) {
  // TODO: refine to improve performance
  parentSpan.children = allSpans.filter(
    (span) => span.parent_id === parentSpan.span_id
  )
  parentSpan.children.forEach((child) => findChildren(child, allSpans))
}

function calcMaxEndTime(span: IFullSpan) {
  // return condition
  if (span.children.length === 0) {
    span.max_end_time_ns = span.end_unix_time_ns
    return span.end_unix_time_ns
  }
  const childrenTime = span.children
    .map((childSpan) => calcMaxEndTime(childSpan))
    .concat(span.end_unix_time_ns)
  const maxTime = Math.max(...childrenTime)
  span.max_end_time_ns = maxTime
  return maxTime
}

function calcHeight(span: IFullSpan) {
  // return condition
  if (span.children.length === 0) {
    span.height = 0 // leaf node
    return 0
  }

  const childrenHeight = span.children.map((childSpan) => calcHeight(childSpan))
  const maxHeight = Math.max(...childrenHeight) + 1
  span.height = maxHeight
  return maxHeight
}

// keep the same logic as datadog
// compare the spans from right to left
// span.max_end_time_ns > lastSpan.begin_unix_time_ns => span.depth = parentSpan.depth + 1
// else => span.depth = lastSpan.depth + lastSpan.height + 2
function calcDepth(parentSpan: IFullSpan) {
  const childrenMaxIdx = parentSpan.children.length - 1
  for (let i = childrenMaxIdx; i >= 0; i--) {
    const curSpan = parentSpan.children[i]
    if (i === childrenMaxIdx) {
      curSpan.depth = parentSpan.depth + 1
      continue
    }
    const lastSpan = parentSpan.children[i + 1]
    if (curSpan.max_end_time_ns > lastSpan.begin_unix_time_ns!) {
      curSpan.depth = lastSpan.depth + lastSpan.height + 2
    } else {
      curSpan.depth = parentSpan.depth + 1
    }
  }
}

//////////////////////
// test

genFlameGraph(testData)
