export const responseTime = (req, res, next) => {
  const start = performance.now();
  let headerSet = false;

  const setHeader = () => {
    if (headerSet) return;
    const duration = performance.now() - start;
    res.setHeader("X-Response-Time", `${duration.toFixed(3)}ms`);
    headerSet = true;
  };

  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    setHeader();
    return originalWriteHead.apply(this, args);
  };

  const originalEnd = res.end;
  res.end = function (...args) {
    setHeader();
    return originalEnd.apply(this, args);
  };

  next();
};
