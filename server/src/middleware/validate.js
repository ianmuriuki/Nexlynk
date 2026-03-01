// src/middleware/validate.js
const Joi = require('joi');

/**
 * validate(schema, property) — validates req[property] against a Joi schema.
 * property defaults to 'body'.
 *
 * Usage:
 *   router.post('/path', validate(mySchema), controller)
 *   router.get('/path', validate(querySchema, 'query'), controller)
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      return res.status(422).json({ error: 'Validation Error', details });
    }

    req[property] = value; // replace with sanitised value
    next();
  };
}

module.exports = { validate };