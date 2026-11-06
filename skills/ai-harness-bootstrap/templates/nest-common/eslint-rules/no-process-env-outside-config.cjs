/**
 * ESLint rule: no-process-env-outside-config
 *
 * `process.env` may be read only inside src/backend/core/config/, where the
 * Zod schema validates it at boot. Anywhere else, inject APP_CONFIG.
 *
 * Catches: `process.env.X`, `process.env['X']`, `const { X } = process.env`,
 * and `process["env"]`.
 */

'use strict';

const ALLOWED = /[\\/]src[\\/]backend[\\/]core[\\/]config[\\/]/;

function isProcessEnv(node) {
  if (node.type !== 'MemberExpression') return false;
  const obj = node.object;
  const prop = node.property;
  if (obj.type !== 'Identifier' || obj.name !== 'process') return false;
  if (!node.computed && prop.type === 'Identifier') return prop.name === 'env';
  if (node.computed && prop.type === 'Literal') return prop.value === 'env';
  return false;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'process.env is read only in src/backend/core/config/; inject APP_CONFIG elsewhere',
    },
    schema: [],
    messages: {
      forbidden:
        'process.env is read only in src/backend/core/config/ (Zod-validated at boot). Inject APP_CONFIG instead.',
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (ALLOWED.test(filename)) return {};
    return {
      MemberExpression(node) {
        if (isProcessEnv(node)) {
          context.report({ node, messageId: 'forbidden' });
        }
      },
    };
  },
};
