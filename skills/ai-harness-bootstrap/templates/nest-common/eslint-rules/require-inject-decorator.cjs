/**
 * ESLint rule: require-inject-decorator
 *
 * Every constructor parameter in a Nest-decorated class (@Injectable, @Controller,
 * @WebSocketGateway, @Catch, @Module) must carry an explicit @Inject() decorator.
 *
 * Rationale:
 *   tsx emits `design:paramtypes` including primitives like `Number`, causing Nest
 *   to look up non-existent providers at boot. @Inject() unambiguously binds the
 *   param to a token and bypasses the reflection gap.
 */

'use strict';

const NEST_CLASS_DECORATORS = new Set([
  'Injectable',
  'Controller',
  'WebSocketGateway',
  'Catch',
  'Module',
]);

/**
 * Returns true if the given decorator node's name matches any of the Nest class
 * decorator names above.
 */
function isNestDecorator(decorator) {
  const expr = decorator.expression;
  if (!expr) return false;

  // @Injectable() — CallExpression whose callee is an Identifier
  if (expr.type === 'CallExpression') {
    const callee = expr.callee;
    if (callee.type === 'Identifier') {
      return NEST_CLASS_DECORATORS.has(callee.name);
    }
    // @nestjs/common.Injectable() — MemberExpression (unlikely but safe to handle)
    if (callee.type === 'MemberExpression' && callee.property.type === 'Identifier') {
      return NEST_CLASS_DECORATORS.has(callee.property.name);
    }
    return false;
  }

  // @Injectable without parens — bare Identifier (rare but syntactically valid)
  if (expr.type === 'Identifier') {
    return NEST_CLASS_DECORATORS.has(expr.name);
  }

  return false;
}

/**
 * Returns true if a constructor parameter's decorators list contains @Inject(...).
 */
function hasInjectDecorator(param) {
  const decorators = param.decorators;
  if (!decorators || decorators.length === 0) return false;

  return decorators.some((dec) => {
    const expr = dec.expression;
    if (!expr) return false;

    // @Inject(Token) — CallExpression
    if (expr.type === 'CallExpression') {
      const callee = expr.callee;
      return callee.type === 'Identifier' && callee.name === 'Inject';
    }

    // @Inject without args — bare Identifier
    if (expr.type === 'Identifier') {
      return expr.name === 'Inject';
    }

    return false;
  });
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require @Inject() on every constructor parameter in Nest-decorated classes.',
      recommended: true,
    },
    messages: {
      missingInject:
        "Nest constructor parameter missing @Inject(). " +
        "tsx emits primitive paramtypes and Nest fails at boot without it.",
    },
    schema: [],
  },

  create(context) {
    return {
      ClassDeclaration(node) {
        checkClass(node, context);
      },
      ClassExpression(node) {
        checkClass(node, context);
      },
    };
  },
};

function checkClass(classNode, context) {
  // Only target classes that carry at least one Nest class decorator.
  const classDecorators = classNode.decorators;
  if (!classDecorators || classDecorators.length === 0) return;

  const hasNestDecorator = classDecorators.some(isNestDecorator);
  if (!hasNestDecorator) return;

  // Find the constructor method.
  const ctor = classNode.body.body.find(
    (member) =>
      member.type === 'MethodDefinition' &&
      member.kind === 'constructor',
  );
  if (!ctor) return;

  const params = ctor.value.params;
  if (!params || params.length === 0) return;

  for (const param of params) {
    // TSParameterProperty wraps `private readonly foo: Foo` — check the wrapper.
    const target =
      param.type === 'TSParameterProperty' ? param : param;

    if (!hasInjectDecorator(target)) {
      context.report({
        node: target,
        messageId: 'missingInject',
      });
    }
  }
}
