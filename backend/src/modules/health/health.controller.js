export const getLiveness = (_req, res) => {
  res.status(200).json({ status: "ok" });
};

export const getReadiness = (_req, res) => {
  res.status(200).json({
    status: "ready",
    checks: {},
  });
};
