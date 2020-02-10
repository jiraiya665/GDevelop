/*
 * GDevelop Core
 * Copyright 2008-present Florian Rival (Florian.Rival@gmail.com). All rights
 * reserved. This project is released under the MIT License.
 */
#ifndef GDCORE_EXPRESSIONNODELOCATIONFINDER_H
#define GDCORE_EXPRESSIONNODELOCATIONFINDER_H

#include <memory>
#include <vector>
#include "GDCore/Events/Parsers/ExpressionParser2Node.h"
#include "GDCore/Events/Parsers/ExpressionParser2NodeWorker.h"
namespace gd {
class Expression;
class ObjectsContainer;
class Platform;
class ParameterMetadata;
class ExpressionMetadata;
}  // namespace gd

namespace gd {

/**
 * \brief Find the deepest node at the specified location in an expression.
 *
 * \see gd::ExpressionParser2
 */
class GD_CORE_API ExpressionNodeLocationFinder
    : public ExpressionParser2NodeWorker {
 public:
  /**
   * \brief Initialize the finder to search at the specified position.
   */
  ExpressionNodeLocationFinder(size_t searchedPosition_)
      : searchedPosition(searchedPosition_), foundNode(nullptr) {};
  virtual ~ExpressionNodeLocationFinder(){};

  /**
   * \brief Helper function to find the deepest node at the search position, if any.
   */
  static ExpressionNode* GetNodeAtPosition(gd::ExpressionNode& node, size_t searchedPosition) {
    gd::ExpressionNodeLocationFinder finder(searchedPosition);
    node.Visit(finder);
    return finder.GetNode();
  }

  /**
   * \brief Return the deepest node found at the search position, if any.
   */
  ExpressionNode* GetNode() { return foundNode; };

 protected:
  void OnVisitSubExpressionNode(SubExpressionNode& node) override {
    CheckSearchPositionInNode(node);
    node.expression->Visit(*this);
  }
  void OnVisitOperatorNode(OperatorNode& node) override {
    if (CheckSearchPositionInNode(node)) {
      node.leftHandSide->Visit(*this);
      node.rightHandSide->Visit(*this);
    }
  }
  void OnVisitUnaryOperatorNode(UnaryOperatorNode& node) override {
    CheckSearchPositionInNode(node);
    node.factor->Visit(*this);
  }
  void OnVisitNumberNode(NumberNode& node) override {
    CheckSearchPositionInNode(node);
  }
  void OnVisitTextNode(TextNode& node) override {
    CheckSearchPositionInNode(node);
  }
  void OnVisitVariableNode(VariableNode& node) override {
    if (CheckSearchPositionInNode(node)) {
      if (node.child) node.child->Visit(*this);
    }
  }
  void OnVisitVariableAccessorNode(VariableAccessorNode& node) override {
    if (CheckSearchPositionInNode(node)) {
      if (node.child) node.child->Visit(*this);
    }
  }
  void OnVisitVariableBracketAccessorNode(
      VariableBracketAccessorNode& node) override {
    if (CheckSearchPositionInNode(node)) {
      node.expression->Visit(*this);
      if (node.child) node.child->Visit(*this);
    }
  }
  void OnVisitIdentifierNode(IdentifierNode& node) override {
    CheckSearchPositionInNode(node);
  }
  void OnVisitFunctionNode(FunctionNode& node) override {
    CheckSearchPositionInNode(node);
    for (auto& parameter : node.parameters) {
      parameter->Visit(*this);
    }
  }
  void OnVisitEmptyNode(EmptyNode& node) override {
    CheckSearchPositionInNode(node);
  }

 private:
  bool CheckSearchPositionInNode(ExpressionNode& node) {
    if (node.location.GetStartPosition() <= searchedPosition &&
        searchedPosition < node.location.GetEndPosition()) {
      foundNode = &node;
      return true;
    }

    return false;
  }

  size_t searchedPosition;
  ExpressionNode* foundNode;
};

}  // namespace gd

#endif  // GDCORE_EXPRESSIONNODELOCATIONFINDER_H
