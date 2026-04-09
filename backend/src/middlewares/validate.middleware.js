export const validate = (schema, source = "body") => (req, res, next) => {
  try {
    if (source === "body") {
      req.body = schema.parse(req.body);
    } else {
      req.parsedQuery = schema.parse(req[source]);
    }
    next();
  } catch (err) {
    next(err);
  }
};