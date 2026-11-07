/**
 * ESLint rule: no-interpolated-sql
 *
 * SQL passed to better-sqlite3's `prepare()` / `exec()` must not interpolate
 * runtime values. Bind them with `?` or `@name` placeholders instead.
 *
 * Allowed `${...}` expressions (static SQL composition, still parameterized):
 * string literals, `.join(...)` calls (placeholder lists, clause lists),
 * conditionals and templates made only of allowed parts, and `const`
 * identifiers whose initializer is allowed (a `where` built from a clause
 * list), and imported SCREAMING_CASE constants (shared SQL fragments from a
 * `*.sql.ts` module).
 *
 * Reported: anything that can carry a runtime value — function parameters,
 * property reads (`input.x`), non-join calls, `let` variables.
 */

'use strict';

const SQL_METHODS = new Set(['prepare', 'exec']);
const UPPER_SNAKE = /^[A-Z][A-Z0-9_]*$/;

function isSqlCall(node) {
  const callee = node.callee;
  return (
    callee.type === 'MemberExpression' &&
    !callee.computed &&
    callee.property.type === 'Identifier' &&
    SQL_METHODS.has(callee.property.name)
  );
}

function isJoinCall(node) {
  return (
    node &&
    node.type === 'CallExpression' &&
    node.callee.type === 'MemberExpression' &&
    !node.callee.computed &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'join'
  );
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'no runtime-value interpolation in SQL passed to prepare()/exec(); bind with placeholders',
    },
    schema: [],
    messages: {
      interpolated:
        'SQL passed to {{method}}() interpolates a runtime value. Bind it with ? or @name. Only module-level SQL fragment constants and .join()-built clause lists may be interpolated.',
    },
  },
  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    function scopeOf(node) {
      return sourceCode.getScope ? sourceCode.getScope(node) : context.getScope();
    }

    function resolveVariable(identifier) {
      for (let s = scopeOf(identifier); s; s = s.upper) {
        const v = s.set.get(identifier.name);
        if (v) return { variable: v, scope: s };
      }
      return null;
    }

    function initializerOf(variable) {
      const def = variable.defs[0];
      if (!def || def.type !== 'Variable' || !def.node.init) return null;
      if (def.parent && def.parent.kind !== 'const') return null;
      return { init: def.node.init, declaration: def.parent };
    }

    /**
     * True when a node is static SQL composition rather than a runtime value:
     * string literals, templates whose every ${} is itself allowed, conditionals
     * whose branches are allowed, .join() calls, and const identifiers whose
     * initializer is allowed. Function parameters and property reads are not.
     */
    function isAllowed(node, seen = new Set()) {
      if (!node) return false;
      switch (node.type) {
        case 'Literal':
          return typeof node.value === 'string';
        case 'TemplateLiteral':
          return node.expressions.every((e) => isAllowed(e, seen));
        case 'ConditionalExpression':
          return isAllowed(node.consequent, seen) && isAllowed(node.alternate, seen);
        case 'LogicalExpression':
          return isAllowed(node.left, seen) && isAllowed(node.right, seen);
        case 'CallExpression':
          return isJoinCall(node);
        case 'Identifier': {
          const found = resolveVariable(node);
          if (!found || seen.has(found.variable)) return false;
          seen.add(found.variable);
          const def = found.variable.defs[0];
          // An imported SCREAMING_CASE binding is a shared SQL fragment constant
          // (convention: exported from a *.sql.ts module). Its body is linted there.
          if (def && def.type === 'ImportBinding') return UPPER_SNAKE.test(node.name);
          const init = initializerOf(found.variable);
          return init ? isAllowed(init.init, seen) : false;
        }
        default:
          return false;
      }
    }

    /** Returns the first offending ${} expression inside a template, or null. */
    function offendingExpression(template, seen = new Set()) {
      for (const expr of template.expressions) {
        if (!isAllowed(expr, seen)) return expr;
      }
      return null;
    }

    function offendingIn(arg) {
      if (arg.type === 'TemplateLiteral') return offendingExpression(arg);
      if (arg.type === 'Identifier') {
        const found = resolveVariable(arg);
        if (!found) return null;
        const init = initializerOf(found.variable);
        if (!init || init.init.type !== 'TemplateLiteral') return null;
        return offendingExpression(init.init, new Set([found.variable]));
      }
      return null;
    }

    return {
      CallExpression(node) {
        if (!isSqlCall(node) || node.arguments.length === 0) return;
        const offender = offendingIn(node.arguments[0]);
        if (offender) {
          context.report({
            node: offender,
            messageId: 'interpolated',
            data: { method: node.callee.property.name },
          });
        }
      },
    };
  },
};
