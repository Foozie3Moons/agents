/**
 * ESLint rule: no-helper-beside-class
 *
 * A file that declares a class declares no module-level functions, exported or not. A
 * function that serves the class is a method of it (usually private), even when it is pure;
 * a standalone calculation used on its own lives in its own file, where it sits beside no
 * class. See "Design: DDD and OOP" in .claude/rules/common.md.
 *
 * Option `baseline`: { '<path from the repo root>': ['<function name>', ...] }. A new repo
 * does not set it. It exists for adding the rule to a codebase that already has violations:
 * the listed functions are not reported, and a listed name that is no longer a function beside
 * a class in its file is reported, so the baseline only ever shrinks.
 */

'use strict';

const path = require('node:path');

function isFunctionValue(node) {
  return Boolean(node) && (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression');
}

/** The class a top-level statement declares, exported or not; null when it declares none. */
function declaredClass(statement) {
  const node =
    statement.type === 'ExportNamedDeclaration' || statement.type === 'ExportDefaultDeclaration'
      ? statement.declaration
      : statement;
  return node && node.type === 'ClassDeclaration' ? node : null;
}

/** Module-level functions a statement declares, exported or not: `function f() {}` and `const f = () => {}`. */
function declaredFunctions(statement) {
  const node = statement.type === 'ExportNamedDeclaration' && statement.declaration ? statement.declaration : statement;
  if (node.type === 'FunctionDeclaration' && node.id) return [node.id];
  if (node.type !== 'VariableDeclaration') return [];
  return node.declarations
    .filter((declarator) => declarator.id.type === 'Identifier' && isFunctionValue(declarator.init))
    .map((declarator) => declarator.id);
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'A file that declares a class declares no module-level functions, exported or not.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          baseline: { type: 'object', additionalProperties: { type: 'array', items: { type: 'string' } } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      misplacedMethod:
        "'{{name}}' is a module-level function next to class '{{className}}'. If it serves the class, make it a method (usually private); if it is a standalone calculation used on its own, move it to its own file. See \"Design: DDD and OOP\" in .claude/rules/common.md.",
      staleBaseline:
        "'{{name}}' is in the no-helper-beside-class baseline for this file but is no longer a function beside a class here. Remove it from the baseline.",
    },
  },

  create(context) {
    const baseline = (context.options[0] && context.options[0].baseline) || {};
    const file = path.relative(context.cwd, context.filename).split(path.sep).join('/');
    const allowed = new Set(baseline[file] || []);

    return {
      Program(program) {
        const firstClass = program.body.map(declaredClass).find((node) => node !== null);
        const className = firstClass && firstClass.id ? firstClass.id.name : 'default';
        const helpers = firstClass ? program.body.flatMap(declaredFunctions) : [];

        for (const id of helpers) {
          if (allowed.has(id.name)) continue;
          context.report({ node: id, messageId: 'misplacedMethod', data: { name: id.name, className } });
        }
        const found = new Set(helpers.map((id) => id.name));
        for (const name of allowed) {
          if (!found.has(name)) context.report({ node: program, messageId: 'staleBaseline', data: { name } });
        }
      },
    };
  },
};
