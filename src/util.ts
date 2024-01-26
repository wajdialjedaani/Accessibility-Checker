import { AnyNode, Element } from "cheerio";

export function isElement(node: AnyNode): node is Element {
  return node.nodeType === NodeType.ELEMENT_NODE;
}

export enum NodeType {
  ELEMENT_NODE = 1,
  ATTRIBUTE_NODE = 2,
  TEXT_NODE = 3,
  PROCESSING_INSTRUCTION_NODE = 7,
  COMMENT_NODE = 9,
}
