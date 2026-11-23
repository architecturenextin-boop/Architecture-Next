import { chromium } from "playwright";
import fs from "fs";

async function runAudit() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  
  const results = {
    timestamp: new Date().toISOString(),
    desktopProd: null,
    mobileProd: null,
    fast3GProd: null,
    slow4GProd: null,
    images: [],
    jsCoverage: [],
    apiCalls: [],
    cwv: {}
  };

  console.log("--- Starting Production Performance Audit on http://127.0.0.1:4173 ---");

  // 1. Desktop Unthrottled Audit
  {
    const context = await browser.newContext({
      viewport: { width: 1366, height: 768 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Performance.enable");

    const requests = new Map();
    client.on("Network.requestWillBeSent", (e) => {
      requests.set(e.requestId, {
        url: e.request.url,
        method: e.request.method,
        type: e.type,
        startTime: e.timestamp,
        headers: e.request.headers,
      });
    });

    client.on("Network.responseReceived", (e) => {
      const req = requests.get(e.requestId);
      if (req) {
        req.status = e.response.status;
        req.mimeType = e.response.mimeType;
        req.responseHeaders = e.response.headers;
        req.timing = e.response.timing;
        req.fromDiskCache = e.response.fromDiskCache;
        req.fromServiceWorker = e.response.fromServiceWorker;
      }
    });

    client.on("Network.loadingFinished", (e) => {
      const req = requests.get(e.requestId);
      if (req) {
        req.encodedDataLength = e.encodedDataLength;
        req.finishTime = e.timestamp;
      }
    });

    // Start JS coverage
    await page.coverage.startJSCoverage({ resetOnNavigation: false });

    // Inject Web Vitals observer before navigation
    await page.addInitScript(() => {
      window.__perfMetrics = {
        fcp: 0,
        lcp: 0,
        lcpElement: null,
        cls: 0,
        clsEntries: [],
        longTasks: [],
        tbt: 0,
        navigationTiming: null,
      };

      // FCP observer
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            window.__perfMetrics.fcp = entry.startTime;
          }
        }
      }).observe({ type: "paint", buffered: true });

      // LCP observer
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1];
          window.__perfMetrics.lcp = lastEntry.startTime;
          if (lastEntry.element) {
            window.__perfMetrics.lcpElement = {
              tagName: lastEntry.element.tagName,
              id: lastEntry.element.id,
              className: lastEntry.element.className,
              src: lastEntry.element.src || null,
              outerHTML: lastEntry.element.outerHTML ? lastEntry.element.outerHTML.slice(0, 200) : null,
            };
          }
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });

      // CLS observer
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__perfMetrics.cls += entry.value;
            window.__perfMetrics.clsEntries.push({
              value: entry.value,
              sources: entry.sources ? entry.sources.map(s => ({
                node: s.node ? s.node.nodeName : null,
                currentRect: s.currentRect,
                previousRect: s.previousRect
              })) : []
            });
          }
        }
      }).observe({ type: "layout-shift", buffered: true });

      // Long Tasks observer
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          window.__perfMetrics.longTasks.push({
            startTime: entry.startTime,
            duration: entry.duration,
            name: entry.name,
          });
          if (entry.duration > 50) {
            window.__perfMetrics.tbt += (entry.duration - 50);
          }
        }
      }).observe({ type: "longtask", buffered: true });
    });

    const navStartTime = Date.now();
    await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000); // Wait for animations & lazy items to settle

    // Get JS coverage
    const coverage = await page.coverage.stopJSCoverage();
    results.jsCoverage = coverage.map((entry) => {
      const src = entry.source || entry.text || "";
      const totalBytes = src.length;
      let usedBytes = 0;

      if (entry.functions && Array.isArray(entry.functions)) {
        const usedRanges = [];
        for (const func of entry.functions) {
          if (func.ranges && Array.isArray(func.ranges)) {
            for (const r of func.ranges) {
              if (r.count > 0) {
                usedRanges.push([r.startOffset, r.endOffset]);
              }
            }
          }
        }
        usedRanges.sort((a, b) => a[0] - b[0]);
        const merged = [];
        for (const [start, end] of usedRanges) {
          if (!merged.length || merged[merged.length - 1][1] < start) {
            merged.push([start, end]);
          } else {
            merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
          }
        }
        for (const [start, end] of merged) {
          usedBytes += (end - start);
        }
      } else if (entry.ranges && Array.isArray(entry.ranges)) {
        for (const range of entry.ranges) {
          usedBytes += (range.end - range.start);
        }
      }

      const unusedBytes = Math.max(0, totalBytes - usedBytes);
      return {
        url: entry.url,
        totalBytes,
        usedBytes,
        unusedBytes,
        unusedPercent: totalBytes > 0 ? ((unusedBytes / totalBytes) * 100).toFixed(1) : "0.0",
      };
    });

    // Evaluate in-page Core Web Vitals & Navigation Timings
    const perfData = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      if (nav) {
        window.__perfMetrics.navigationTiming = {
          dns: nav.domainLookupEnd - nav.domainLookupStart,
          tcp: nav.connectEnd - nav.connectStart,
          ssl: nav.secureConnectionStart > 0 ? nav.connectEnd - nav.secureConnectionStart : 0,
          ttfb: nav.responseStart - nav.requestStart,
          download: nav.responseEnd - nav.responseStart,
          domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
          loadEvent: nav.loadEventEnd - nav.startTime,
          totalDuration: nav.duration,
        };
      }
      return window.__perfMetrics;
    });
    results.desktopProd = perfData;

    // Evaluate Images on page
    const imagesInfo = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll("img"));
      return imgs.map((img) => {
        const rect = img.getBoundingClientRect();
        return {
          src: img.src,
          currentSrc: img.currentSrc,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          renderedWidth: Math.round(rect.width),
          renderedHeight: Math.round(rect.height),
          loading: img.getAttribute("loading"),
          fetchPriority: img.getAttribute("fetchpriority"),
          isAboveFold: rect.top < window.innerHeight,
          alt: img.alt,
          classes: img.className,
        };
      });
    });

    // Match images with network requests for file sizes
    results.images = imagesInfo.map((img) => {
      let matchingReq = null;
      for (const [id, req] of requests) {
        if (req.url === img.src || req.url === img.currentSrc) {
          matchingReq = req;
          break;
        }
      }
      return {
        ...img,
        fileSize: matchingReq ? matchingReq.encodedDataLength : null,
        mimeType: matchingReq ? matchingReq.mimeType : null,
        timing: matchingReq ? matchingReq.timing : null,
      };
    });

    // Filter API calls (fetch/xhr)
    results.apiCalls = Array.from(requests.values())
      .filter((r) => r.type === "Fetch" || r.type === "XHR")
      .map((r) => {
        let ttfb = 0;
        let duration = 0;
        if (r.timing) {
          ttfb = r.timing.receiveHeadersEnd - r.timing.sendEnd;
          duration = (r.finishTime - r.startTime) * 1000;
        }
        return {
          url: r.url,
          method: r.method,
          status: r.status,
          ttfb: Math.round(ttfb),
          duration: Math.round(duration),
          size: r.encodedDataLength,
          fromCache: r.fromDiskCache,
        };
      });

    results.allRequests = Array.from(requests.values()).map(r => ({
      url: r.url,
      type: r.type,
      status: r.status,
      size: r.encodedDataLength,
      startTime: r.startTime,
      finishTime: r.finishTime,
      duration: r.finishTime && r.startTime ? Math.round((r.finishTime - r.startTime) * 1000) : 0,
      ttfb: r.timing ? Math.round(r.timing.receiveHeadersEnd - r.timing.sendEnd) : 0
    }));

    await context.close();
  }

  // 2. Mobile Emulation (Pixel 7 / iPhone: 390x844)
  {
    console.log("--- Starting Mobile Audit ---");
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
    });
    const page = await context.newPage();

    await page.addInitScript(() => {
      window.__perfMetrics = { fcp: 0, lcp: 0, lcpElement: null, cls: 0, tbt: 0 };
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (e.name === "first-contentful-paint") window.__perfMetrics.fcp = e.startTime;
      }).observe({ type: "paint", buffered: true });
      new PerformanceObserver((l) => {
        const es = l.getEntries();
        if (es.length) {
          window.__perfMetrics.lcp = es[es.length - 1].startTime;
          const el = es[es.length - 1].element;
          if (el) window.__perfMetrics.lcpElement = { tag: el.tagName, src: el.src || null, class: el.className };
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perfMetrics.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (e.duration > 50) window.__perfMetrics.tbt += (e.duration - 50);
      }).observe({ type: "longtask", buffered: true });
    });

    await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const perfData = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      return {
        ...window.__perfMetrics,
        ttfb: nav ? nav.responseStart - nav.requestStart : 0,
        load: nav ? nav.loadEventEnd - nav.startTime : 0
      };
    });
    results.mobileProd = perfData;
    await context.close();
  }

  // 3. Fast 3G Simulation
  // Latency: 150ms, DL: 1.6 Mbps (200 KB/s), UL: 750 kbps (93.75 KB/s)
  {
    console.log("--- Starting Fast 3G Emulation ---");
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: (1.6 * 1024 * 1024) / 8,
      uploadThroughput: (750 * 1024) / 8,
    });

    await page.addInitScript(() => {
      window.__perfMetrics = { fcp: 0, lcp: 0, cls: 0, tbt: 0 };
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (e.name === "first-contentful-paint") window.__perfMetrics.fcp = e.startTime;
      }).observe({ type: "paint", buffered: true });
      new PerformanceObserver((l) => {
        const es = l.getEntries();
        if (es.length) window.__perfMetrics.lcp = es[es.length - 1].startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perfMetrics.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (e.duration > 50) window.__perfMetrics.tbt += (e.duration - 50);
      }).observe({ type: "longtask", buffered: true });
    });

    const start = Date.now();
    await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const perfData = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      return {
        ...window.__perfMetrics,
        ttfb: nav ? nav.responseStart - nav.requestStart : 0,
        domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : 0,
        load: nav ? nav.loadEventEnd - nav.startTime : 0
      };
    });
    results.fast3GProd = perfData;
    await context.close();
  }

  // 4. Slow 4G Simulation
  // Latency: 100ms, DL: 4 Mbps (500 KB/s), UL: 3 Mbps (375 KB/s)
  {
    console.log("--- Starting Slow 4G Emulation ---");
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    await client.send("Network.enable");
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 100,
      downloadThroughput: (4 * 1024 * 1024) / 8,
      uploadThroughput: (3 * 1024 * 1024) / 8,
    });

    await page.addInitScript(() => {
      window.__perfMetrics = { fcp: 0, lcp: 0, cls: 0, tbt: 0 };
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (e.name === "first-contentful-paint") window.__perfMetrics.fcp = e.startTime;
      }).observe({ type: "paint", buffered: true });
      new PerformanceObserver((l) => {
        const es = l.getEntries();
        if (es.length) window.__perfMetrics.lcp = es[es.length - 1].startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perfMetrics.cls += e.value;
      }).observe({ type: "layout-shift", buffered: true });
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (e.duration > 50) window.__perfMetrics.tbt += (e.duration - 50);
      }).observe({ type: "longtask", buffered: true });
    });

    await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);

    const perfData = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      return {
        ...window.__perfMetrics,
        ttfb: nav ? nav.responseStart - nav.requestStart : 0,
        domContentLoaded: nav ? nav.domContentLoadedEventEnd - nav.startTime : 0,
        load: nav ? nav.loadEventEnd - nav.startTime : 0
      };
    });
    results.slow4GProd = perfData;
    await context.close();
  }

  await browser.close();

  fs.writeFileSync("audit-results.json", JSON.stringify(results, null, 2));
  console.log("Audit complete! Results saved to audit-results.json");
}

runAudit().catch(console.error);
