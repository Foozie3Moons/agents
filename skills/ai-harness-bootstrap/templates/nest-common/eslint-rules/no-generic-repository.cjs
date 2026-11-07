/**
 * ESLint rule: no-generic-repository
 *
 * Bans the generic Repository<T> interface inside Nest modules. Flags two shapes:
 *
 * 1. `import { Repository }` / `import type { Repository }` — pulling in a generic
 *    Repository symbol from any source module.
 * 2. `class X implements Repository<...>` / `class X implements Repository` — declaring
 *    a class that implements the generic CRUD interface rather than named domain methods.
 *
 * Rationale: see `.claude/rules/backend.md` §Repository Pattern. Named domain
 * methods (byName, restock, archive…) express intent at the call site and decouple
 * consumers from storage implementation details. The generic CRUD shape leaks "this is
 * a database table" into every consumer and makes null-on-not-found look identical to
 * null-on-error.
 *
 * Scoped to `src/backend/**` and `src/backend-for-frontend/**` in eslint.config.cjs.
 * Test files (`**\/*.test.ts`) are excluded so test doubles can use CRUD shapes for
 * isolation without tripping this rule.
 */

'use strict';

const MESSAGE =
  'Generic Repository<T> interface is banned in Nest modules. Use named domain methods. ' +
  'See .claude/rules/backend.md §Repository Pattern.';

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Ban generic Repository<T> imports and implements clauses in Nest modules.',
      recommended: true,
    },
    messages: {
      noGenericRepository: MESSAGE,
    },
    schema: [],
  },

  create(context) {
    return {
      /**
       * Flag: import { Repository } / import type { Repository }
       *
       * Covers any ImportDeclaration that has a named specifier whose local or
       * imported name is exactly "Repository". This catches both:
       *   import { Repository } from 'somewhere';
       *   import type { Repository } from 'somewhere';
       *   import { Repository as Repo } from 'somewhere'; // imported name is Repository
       */
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          if (specifier.type !== 'ImportSpecifier') continue;

          // specifier.imported is the name as it appears in the source module.
          const importedName =
            specifier.imported.type === 'Identifier'
              ? specifier.imported.name
              : null;

          if (importedName === 'Repository') {
            context.report({ node: specifier, messageId: 'noGenericRepository' });
          }
        }
      },

      /**
       * Flag: class X implements Repository / class X implements Repository<...>
       *
       * The implements clause is represented in @typescript-eslint/parser as
       * node.implements — an array of TSClassImplements nodes. Each TSClassImplements
       * node has an `expression` property (the type being implemented).
       *
       * We check both plain Identifier (`Repository`) and TSTypeReference whose
       * typeName is an Identifier named `Repository`.
       */
      ClassDeclaration(node) {
        checkImplements(node, context);
      },
      ClassExpression(node) {
        checkImplements(node, context);
      },
    };
  },
};

/**
 * Reports if the class implements a type whose root name is `Repository`.
 *
 * @param {import('eslint').Rule.Node} classNode
 * @param {import('eslint').Rule.RuleContext} context
 */
function checkImplements(classNode, context) {
  const impl = classNode.implements;
  if (!impl || impl.length === 0) return;

  for (const clause of impl) {
    // clause is a TSClassImplements node.
    // clause.expression is the base type reference (Identifier or MemberExpression).
    const expr = clause.expression;
    if (!expr) continue;

    // Plain `implements Repository` or `implements Repository<T>`
    if (expr.type === 'Identifier' && expr.name === 'Repository') {
      context.report({ node: clause, messageId: 'noGenericRepository' });
      continue;
    }

    // `implements Ns.Repository` or `implements Ns.Repository<T>` — MemberExpression
    if (
      expr.type === 'MemberExpression' &&
      expr.property.type === 'Identifier' &&
      expr.property.name === 'Repository'
    ) {
      context.report({ node: clause, messageId: 'noGenericRepository' });
    }
  }
}
