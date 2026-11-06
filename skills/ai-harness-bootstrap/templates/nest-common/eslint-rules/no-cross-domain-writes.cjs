/**
 * ESLint rule: no-cross-domain-writes
 *
 * Applies only to repos that group bounded contexts under src/backend/domains/.
 * An application service in
 * one domain (src/backend/domains/<a>/application/) may read from
 * another domain's application service but must never call a method that
 * mutates that domain's state. Cross-domain writes are the agent's job via
 * separate tool calls.
 *
 * Heuristic, since the linter cannot see SQL:
 *   1. Collect constructor parameters whose type annotation is a class imported
 *      from src/backend/domains/<b>/application/ with b !== a.
 *   2. Flag `this.<param>.<method>(...)` where <method> starts with a mutating
 *      verb.
 *
 * Read-shaped names (findX, byX, listX, ensureExists, hydrateX, getX) pass.
 */

'use strict';

const MUTATING_PREFIXES = [
  'create', 'insert', 'update', 'delete', 'remove', 'set', 'add', 'mark',
  'restock', 'record', 'archive', 'patch', 'upsert', 'save', 'clear', 'toggle',
  'write', 'append', 'tombstone', 'restore', 'reset', 'increment', 'decrement',
];

const DOMAIN_RE = /[\\/]src[\\/]backend[\\/]domains[\\/]([^\\/]+)[\\/]application[\\/]/;
const FOREIGN_IMPORT_RE = /(?:^|[\\/])(?:\.\.[\\/])+([^\\/]+)[\\/]application[\\/]/;

function isMutating(name) {
  const lower = name.toLowerCase();
  return MUTATING_PREFIXES.some((p) => lower.startsWith(p));
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'application services never call mutating methods on another domain\'s service',
    },
    schema: [],
    messages: {
      crossDomainWrite:
        '`{{member}}.{{method}}()` writes to domain "{{domain}}" from domain "{{self}}". Cross-domain writes are the agent\'s job (ADR-0003). Expose a read, or make the agent issue a second tool call.',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    const m = DOMAIN_RE.exec(filename);
    if (!m) return {};
    const selfDomain = m[1];

    // class name -> foreign domain name
    const foreignServices = new Map();
    // this-member name -> foreign domain name
    const foreignMembers = new Map();

    return {
      ImportDeclaration(node) {
        const src = node.source.value;
        if (typeof src !== 'string') return;
        const fm = FOREIGN_IMPORT_RE.exec(src);
        if (!fm) return;
        const domain = fm[1];
        if (domain === selfDomain) return;
        for (const spec of node.specifiers) {
          if (spec.type === 'ImportSpecifier' || spec.type === 'ImportDefaultSpecifier') {
            foreignServices.set(spec.local.name, domain);
          }
        }
      },

      'MethodDefinition[kind="constructor"]'(node) {
        for (const param of node.value.params) {
          const target = param.type === 'TSParameterProperty' ? param.parameter : param;
          if (target.type !== 'Identifier' || !target.typeAnnotation) continue;
          const ann = target.typeAnnotation.typeAnnotation;
          if (ann.type !== 'TSTypeReference' || ann.typeName.type !== 'Identifier') continue;
          const domain = foreignServices.get(ann.typeName.name);
          if (domain) foreignMembers.set(target.name, domain);
        }
      },

      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== 'MemberExpression' || callee.computed) return;
        if (callee.property.type !== 'Identifier') return;
        const obj = callee.object;
        if (obj.type !== 'MemberExpression' || obj.object.type !== 'ThisExpression') return;
        if (obj.computed || obj.property.type !== 'Identifier') return;
        const domain = foreignMembers.get(obj.property.name);
        if (!domain) return;
        const method = callee.property.name;
        if (!isMutating(method)) return;
        context.report({
          node: callee,
          messageId: 'crossDomainWrite',
          data: { member: `this.${obj.property.name}`, method, domain, self: selfDomain },
        });
      },
    };
  },
};
