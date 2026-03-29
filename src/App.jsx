import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import heroVideo from "./hero.mp4";

const frameModules = import.meta.glob("./introduction/*.jpg", {
  eager: true,
  import: "default",
});

const explorationFrameModules = import.meta.glob("./Exploration/*.jpg", {
  eager: true,
  import: "default",
});

const insightsFrameModules = import.meta.glob("./insights/*.jpg", {
  eager: true,
  import: "default",
});

const frameUrls = Object.entries(frameModules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, src]) => src);

const explorationFrameUrls = Object.entries(explorationFrameModules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, src]) => src);

const insightsFrameUrls = Object.entries(insightsFrameModules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, src]) => src);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const beatOpacity = (progress, start, end) => {
  const fadeSpan = 0.045;
  if (progress < start || progress > end) return 0;
  if (progress <= start + fadeSpan) {
    return clamp((progress - start) / fadeSpan, 0, 1);
  }
  if (progress >= end - fadeSpan) {
    return clamp((end - progress) / fadeSpan, 0, 1);
  }
  return 1;
};

const scientificInsights = [
  {
    title: "Iron-Rich Surface",
    description:
      "Martian soil is rich in iron oxide, giving the planet its deep red color. Detailed analysis reveals complex mineral structures formed over billions of years.",
  },
  {
    title: "Geological Evolution",
    description:
      "Layered rock formations indicate a dynamic geological past. Evidence suggests volcanic activity, erosion, and sedimentation shaped the terrain.",
  },
  {
    title: "Water History",
    description:
      "Traces of ancient riverbeds and subsurface ice deposits suggest Mars once held flowing water. These discoveries reshape our understanding of planetary evolution.",
  },
  {
    title: "Atmospheric Conditions",
    description:
      "The thin Martian atmosphere, composed primarily of carbon dioxide, creates extreme environmental conditions. Dust storms can engulf the entire planet for weeks.",
  },
  {
    title: "Temperature Variations",
    description:
      "Surface temperatures fluctuate drastically, from mild daytime warmth to extreme nighttime cold below -60°C.",
  },
  {
    title: "Potential for Life",
    description:
      "Scientists continue to search for microbial life beneath the surface. Mars remains one of the most promising locations for discovering extraterrestrial life.",
  },
];

export default function App() {
  const [launched, setLaunched] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeScientificIndex, setActiveScientificIndex] = useState(0);
  const [visibleScientificIndices, setVisibleScientificIndices] = useState(
    scientificInsights.map((_, index) => index === 0)
  );
  const sectionRef = useRef(null);
  const scientificScrollRef = useRef(null);
  const scientificBlockRefs = useRef([]);
  const canvasRef = useRef(null);
  const framesRef = useRef([]);
  const currentFrameRef = useRef(-1);
  const rafRef = useRef(0);
  const explorationCanvasRef = useRef(null);
  const explorationFramesRef = useRef([]);
  const explorationCurrentFrameRef = useRef(-1);
  const insightsCanvasRef = useRef(null);
  const insightsFramesRef = useRef([]);
  const insightsCurrentFrameRef = useRef(-1);

  const totalFrames = frameUrls.length;
  const totalExplorationFrames = explorationFrameUrls.length;
  const totalInsightsFrames = insightsFrameUrls.length;

  const introProgress = useMemo(() => clamp(progress / 0.333, 0, 1), [progress]);
  const explorationProgress = useMemo(() => clamp((progress - 0.333) / 0.333, 0, 1), [progress]);
  const insightsProgress = useMemo(() => clamp((progress - 0.666) / 0.334, 0, 1), [progress]);
  const introCanvasOpacity = useMemo(() => {
    if (progress <= 0.32) return 1;
    return clamp((0.34 - progress) / 0.02, 0, 1);
  }, [progress]);
  const explorationCanvasOpacity = useMemo(() => {
    if (progress <= 0.32 || progress >= 0.67) return 0;
    if (progress <= 0.34) return clamp((progress - 0.32) / 0.02, 0, 1);
    if (progress >= 0.65) return clamp((0.67 - progress) / 0.02, 0, 1);
    return 1;
  }, [progress]);
  const insightsCanvasOpacity = useMemo(() => {
    if (progress <= 0.65) return 0;
    return clamp((progress - 0.65) / 0.02, 0, 1);
  }, [progress]);

  const beats = useMemo(
    () => ({
      hero: beatOpacity(introProgress, 0, 0.2),
      engineering: beatOpacity(introProgress, 0.15, 0.42),
      noise: beatOpacity(introProgress, 0.4, 0.67),
      sound: beatOpacity(introProgress, 0.65, 0.88),
      cta: beatOpacity(introProgress, 0.85, 1),
    }),
    [introProgress]
  );

  const explorationBeats = useMemo(
    () => ({
      hero: beatOpacity(explorationProgress, 0, 0.2),
      engineering: beatOpacity(explorationProgress, 0.15, 0.42),
      noise: beatOpacity(explorationProgress, 0.4, 0.67),
      sound: beatOpacity(explorationProgress, 0.65, 0.88),
      cta: beatOpacity(explorationProgress, 0.85, 1),
    }),
    [explorationProgress]
  );

  const insightsBeats = useMemo(
    () => ({
      hero: beatOpacity(insightsProgress, 0, 0.2),
      engineering: beatOpacity(insightsProgress, 0.15, 0.42),
      noise: beatOpacity(insightsProgress, 0.4, 0.67),
      sound: beatOpacity(insightsProgress, 0.65, 0.88),
      cta: beatOpacity(insightsProgress, 0.85, 1),
    }),
    [insightsProgress]
  );

  useEffect(() => {
    if (!launched) return undefined;

    const loadedFrames = frameUrls.map((src) => {
      const image = new Image();
      image.src = src;
      return image;
    });

    framesRef.current = loadedFrames;

    const first = loadedFrames[0];
    if (first) {
      first.onload = () => {
        drawFrame(0, true);
      };
      if (first.complete) {
        drawFrame(0, true);
      }
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [launched, activeScientificIndex]);

  useEffect(() => {
    if (!launched) return undefined;

    const loadedFrames = explorationFrameUrls.map((src) => {
      const image = new Image();
      image.src = src;
      return image;
    });

    explorationFramesRef.current = loadedFrames;

    const first = loadedFrames[0];
    if (first) {
      first.onload = () => {
        drawExplorationFrame(0, true);
      };
      if (first.complete) {
        drawExplorationFrame(0, true);
      }
    }

    return undefined;
  }, [launched]);

  useEffect(() => {
    if (!launched) return undefined;

    const loadedFrames = insightsFrameUrls.map((src) => {
      const image = new Image();
      image.src = src;
      return image;
    });

    insightsFramesRef.current = loadedFrames;

    const first = loadedFrames[0];
    if (first) {
      first.onload = () => {
        drawInsightsFrame(0, true);
      };
      if (first.complete) {
        drawInsightsFrame(0, true);
      }
    }

    return undefined;
  }, [launched]);

  useEffect(() => {
    if (!launched) return undefined;

    const updateProgress = () => {
      const section = sectionRef.current;
      if (!section) return;

      const top = section.offsetTop;
      const scrollable = section.offsetHeight - window.innerHeight;
      const nextProgress = clamp((window.scrollY - top) / scrollable, 0, 1);

      setProgress(nextProgress);
      drawFromProgress(nextProgress);
      drawExplorationFromProgress(nextProgress);
      drawInsightsFromProgress(nextProgress);
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        updateProgress();
        rafRef.current = 0;
      });
    };

    const onResize = () => {
      resizeCanvas();
      resizeExplorationCanvas();
      resizeInsightsCanvas();
      updateProgress();
    };

    resizeCanvas();
    resizeExplorationCanvas();
    resizeInsightsCanvas();
    updateProgress();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [launched]);

  useEffect(() => {
    if (!launched) return;

    const timer = window.setTimeout(() => {
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [launched]);

  useEffect(() => {
    if (!launched) return undefined;

    const scrollRoot = scientificScrollRef.current;
    if (!scrollRoot) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = activeScientificIndex;
        let bestRatio = -1;

        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute("data-insight-index"));
          if (Number.isNaN(index)) return;

          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            bestIndex = index;
          }

          if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
            setVisibleScientificIndices((prev) => {
              if (prev[index]) return prev;
              const next = [...prev];
              next[index] = true;
              return next;
            });
          }
        });

        if (bestRatio >= 0) {
          setActiveScientificIndex(bestIndex);
        }
      },
      {
        root: scrollRoot,
        rootMargin: "-12% 0px -20% 0px",
        threshold: [0.2, 0.4, 0.65, 0.9],
      }
    );

    scientificBlockRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => {
      observer.disconnect();
    };
  }, [launched]);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(window.innerWidth * dpr);
    const height = Math.floor(window.innerHeight * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  const drawFromProgress = (value, force = false) => {
    if (!totalFrames) return;
    const targetFrame = Math.round(clamp(value / 0.333, 0, 1) * (totalFrames - 1));
    drawFrame(targetFrame, force);
  };

  const resizeExplorationCanvas = () => {
    const canvas = explorationCanvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(window.innerWidth * dpr);
    const height = Math.floor(window.innerHeight * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  const drawExplorationFromProgress = (value, force = false) => {
    if (!totalExplorationFrames) return;
    const normalized = clamp((value - 0.333) / 0.333, 0, 1);
    const targetFrame = Math.round(normalized * (totalExplorationFrames - 1));
    drawExplorationFrame(targetFrame, force);
  };

  const resizeInsightsCanvas = () => {
    const canvas = insightsCanvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(window.innerWidth * dpr);
    const height = Math.floor(window.innerHeight * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  };

  const drawInsightsFromProgress = (value, force = false) => {
    if (!totalInsightsFrames) return;
    const normalized = clamp((value - 0.666) / 0.334, 0, 1);
    const targetFrame = Math.round(normalized * (totalInsightsFrames - 1));
    drawInsightsFrame(targetFrame, force);
  };

  const drawFrame = (index, force = false) => {
    const canvas = canvasRef.current;
    const image = framesRef.current[index];
    if (!canvas || !image || (!image.complete && !image.naturalWidth)) return;

    if (!force && currentFrameRef.current === index) return;
    currentFrameRef.current = index;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#050505";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Use cover scaling so every frame fills the viewport with no letterboxing.
    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const drawWidth = Math.ceil(image.naturalWidth * scale);
    const drawHeight = Math.ceil(image.naturalHeight * scale);
    const offsetX = Math.floor((canvas.width - drawWidth) * 0.5);
    const offsetY = Math.floor((canvas.height - drawHeight) * 0.5);

    context.imageSmoothingEnabled = false;
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  };

  const drawExplorationFrame = (index, force = false) => {
    const canvas = explorationCanvasRef.current;
    const image = explorationFramesRef.current[index];
    if (!canvas || !image || (!image.complete && !image.naturalWidth)) return;

    if (!force && explorationCurrentFrameRef.current === index) return;
    explorationCurrentFrameRef.current = index;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#050505";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const drawWidth = Math.ceil(image.naturalWidth * scale);
    const drawHeight = Math.ceil(image.naturalHeight * scale);
    const offsetX = Math.floor((canvas.width - drawWidth) * 0.5);
    const offsetY = Math.floor((canvas.height - drawHeight) * 0.5);

    context.imageSmoothingEnabled = false;
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  };

  const drawInsightsFrame = (index, force = false) => {
    const canvas = insightsCanvasRef.current;
    const image = insightsFramesRef.current[index];
    if (!canvas || !image || (!image.complete && !image.naturalWidth)) return;

    if (!force && insightsCurrentFrameRef.current === index) return;
    insightsCurrentFrameRef.current = index;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#050505";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
    const drawWidth = Math.ceil(image.naturalWidth * scale);
    const drawHeight = Math.ceil(image.naturalHeight * scale);
    const offsetX = Math.floor((canvas.width - drawWidth) * 0.5);
    const offsetY = Math.floor((canvas.height - drawHeight) * 0.5);

    context.imageSmoothingEnabled = false;
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  };

  const beatStyle = (opacity, side = "center") => ({
    opacity,
    transform: `translate3d(0, ${Math.round((1 - opacity) * 24)}px, 0)`,
    textAlign: side,
  });

  const handleLaunch = () => {
    setLaunched(true);
  };

  return (
    <main className="page">
      <section className="launch-hero" id="mars-hero">
        <video className="launch-video" autoPlay muted loop playsInline>
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="launch-overlay" aria-hidden="true" />

        <header className="launch-header">
          <div className="launch-logo">MARS</div>
          <button className="launch-menu" type="button">
            Menu
          </button>
        </header>

        <div className="launch-content">
          <h1 className="launch-title">
            MISSION <span>MARS</span>
          </h1>
          <p className="launch-subtitle">The journey beyond earth begins now.</p>
          <button className="launch-btn" type="button" onClick={handleLaunch}>
            Initiate Launch <span>🚀</span>
          </button>

          <aside className="launch-card">
            <h3>Mission Control</h3>
            <p>{launched ? "Launch sequence started." : "All systems nominal."}</p>
          </aside>
        </div>
      </section>

      {launched && (
        <>
          <section ref={sectionRef} className="story" id="overview">
            <div className="story-stage">
              <canvas
                ref={canvasRef}
                className="story-canvas"
                style={{ opacity: introCanvasOpacity }}
              />

              <canvas
                ref={explorationCanvasRef}
                className="story-canvas"
                style={{ opacity: explorationCanvasOpacity }}
              />

              <canvas
                ref={insightsCanvasRef}
                className="story-canvas"
                style={{ opacity: insightsCanvasOpacity }}
              />

              <div className="story-glow" aria-hidden="true" />

              <div className="story-copy center" style={beatStyle(beats.hero, "center")}>
                <p className="eyebrow">Launch Sequence</p>
                <h1 className="headline gradient-text">Breaking Through Earth's Atmosphere</h1>
                <h2 className="subheadline">Mission to Mars</h2>
                <p className="body-copy max-wide">
                  The engines ignite. Gravity resists. But the mission has begun. As the rocket rises, Earth slowly fades behind, and the journey into the unknown begins.
                </p>
              </div>

              <div className="story-copy left" id="technology" style={beatStyle(beats.engineering, "left")}>
                <p className="eyebrow">Ascent Feed</p>
                <h3 className="section-title gradient-text">Earthfall in progress.</h3>
                <p className="body-copy">
                  Altitude increasing rapidly
                </p>
                <p className="body-copy">
                  Atmospheric resistance decreasing
                </p>
              </div>

              <div className="story-copy right" id="noise" style={beatStyle(beats.noise, "left")}>
                <p className="eyebrow">Flight Conditions</p>
                <h3 className="section-title gradient-text">Upper atmosphere crossing.</h3>
                <ul className="feature-list">
                  <li>Altitude increasing rapidly</li>
                  <li>Atmospheric resistance decreasing</li>
                  <li>Entering near-space conditions</li>
                </ul>
              </div>

              <div className="story-copy left" id="specs" style={beatStyle(beats.sound, "left")}>
                <p className="eyebrow">Status: Leaving Earth</p>
                <h3 className="section-title gradient-text">Mission telemetry.</h3>
                <p className="body-copy">
                  Altitude: 120 km
                </p>
                <p className="body-copy">
                  Speed: 27,000 km/h
                </p>
              </div>

              <div className="story-copy center" id="buy" style={beatStyle(beats.cta, "center")}>
                <p className="eyebrow">MISSION PHASE</p>
                <h3 className="section-title gradient-text">Leave Earth behind. Enter the unknown.</h3>
                <p className="body-copy max-wide">
                  The engines fade into silence as the vastness of space surrounds you. This is no longer Earth — this is the beginning of humanity’s journey beyond.
                </p>
                <div className="cta-row">
                  <button className="primary-btn" type="button">
                    Continue Mission 🚀
                  </button>
                  <a className="secondary-link" href="#specs">
                    View Mission Details
                  </a>
                </div>
              </div>

              <div className="story-copy center" style={beatStyle(explorationBeats.hero, "center")}>
                <p className="eyebrow">EXPLORATION PHASE</p>
                <h1 className="headline gradient-text">Approaching the Red Frontier.</h1>
                <h2 className="subheadline">
                  Millions of kilometers behind you, Earth fades into memory. Ahead lies Mars - silent, distant, and waiting.
                </h2>
              </div>

              <div className="story-copy left" id="exploration-guidance" style={beatStyle(explorationBeats.engineering, "left")}>
                <p className="eyebrow">Navigation systems locked on target.</p>
                <h3 className="section-title gradient-text">Velocity stable. Course aligned.</h3>
                <p className="body-copy">Entering Martian influence.</p>
              </div>

              <div className="story-copy right" id="exploration-systems" style={beatStyle(explorationBeats.noise, "left")}>
                <p className="eyebrow">Technical Layer</p>
                <h3 className="section-title gradient-text">Autonomous sequence active.</h3>
                <ul className="feature-list">
                  <li>Autonomous guidance systems adjust trajectory in real time.</li>
                  <li>External sensors scan terrain and atmospheric conditions.</li>
                  <li>Every calculation brings the mission closer to touchdown.</li>
                </ul>
              </div>

              <div className="story-copy left" id="exploration-status" style={beatStyle(explorationBeats.sound, "left")}>
                <p className="eyebrow">Status: Deep space cruise</p>
                <h3 className="section-title gradient-text">Signal delay: Increasing</h3>
                <p className="body-copy">Distance to Mars: Closing rapidly</p>
                <p className="body-copy">Status: Deep space cruise</p>
              </div>

              <div className="story-copy center" id="exploration-cta" style={beatStyle(explorationBeats.cta, "center")}>
                <p className="eyebrow">Status: Deep space cruise</p>
                <h3 className="section-title gradient-text">Approaching the Red Frontier.</h3>
                <p className="body-copy max-wide">Entering Martian influence.</p>
                <div className="cta-row">
                  <button className="primary-btn" type="button">
                    Scan Surface 🌌
                  </button>
                  <a className="secondary-link" href="#exploration-status">
                    View Mission Path
                  </a>
                </div>
              </div>
              <div className="story-copy center" style={beatStyle(insightsBeats.hero, "center")}>
                <p className="eyebrow">DESCENT PHASE</p>
                <h1 className="headline gradient-text">Descent to the Red Planet.</h1>
                <h2 className="subheadline">
                  Mars fills your horizon. The spacecraft pierces the atmosphere as the final approach begins — precise, controlled, inevitable.
                </h2>
              </div>

              <div className="story-copy left" id="descent-start" style={beatStyle(insightsBeats.engineering, "left")}>
                <p className="eyebrow">Entry Systems Active</p>
                <h3 className="section-title gradient-text">Atmospheric entry initiated.</h3>
                <p className="body-copy">Velocity rapidly decreasing.</p>
                <p className="body-copy">Landing systems fully engaged.</p>
              </div>

              <div className="story-copy right" id="descent-technical" style={beatStyle(insightsBeats.noise, "left")}>
                <p className="eyebrow">Technical Sequence</p>
                <h3 className="section-title gradient-text">Advanced Systems Engaged.</h3>
                <ul className="feature-list">
                  <li>Thrusters fire in calculated bursts, stabilizing descent through the thin Martian atmosphere.</li>
                  <li>Advanced sensors map the terrain below, identifying a safe landing zone in real time.</li>
                  <li>Autonomous systems take control — every movement optimized for precision and survival.</li>
                </ul>
              </div>

              <div className="story-copy left" id="descent-status" style={beatStyle(insightsBeats.sound, "left")}>
                <p className="eyebrow">Descent Telemetry</p>
                <h3 className="section-title gradient-text">Landing in progress.</h3>
                <p className="body-copy">Altitude: 12 km ↓</p>
                <p className="body-copy">Surface Temperature: -63°C</p>
                <p className="body-copy">Status: Landing in progress</p>
              </div>

              <div className="story-copy center" id="descent-cta" style={beatStyle(insightsBeats.cta, "center")}>
                <p className="eyebrow">LANDING PHASE</p>
                <h3 className="section-title gradient-text">Contact achieved. Mission phase complete.</h3>
                <p className="body-copy max-wide">
                  The engines settle into silence as the dust begins to settle around you. You have arrived. Mars is no longer a horizon — it is your landing site.
                </p>
                <div className="cta-row">
                  <button className="primary-btn" type="button">
                    Deploy Rover 🚗
                  </button>
                  <a className="secondary-link" href="#descent-status">
                    Analyze Landing Site
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="scientific-insights" id="scientific-insights">
            <div className="scientific-split">
              <aside className="scientific-left">
                <p className="scientific-kicker">Scientific Insights</p>
                <h2>Rover Discoveries Across the Martian Surface.</h2>
                <p>
                  A live stream of planetary observations is unfolding below. The left panel anchors
                  the mission context while the right panel scrolls through deep field reports.
                </p>

                <div className="scientific-progress" aria-hidden="true">
                  {scientificInsights.map((item, index) => (
                    <div
                      key={item.title}
                      className={`progress-dot ${index === activeScientificIndex ? "is-active" : ""}`}
                    />
                  ))}
                </div>
              </aside>

              <div className="scientific-right-shell">
                <div
                  className="scientific-right-scroll"
                  ref={scientificScrollRef}
                  role="region"
                  aria-label="Scrollable scientific insights"
                >
                  {scientificInsights.map((insight, index) => (
                    <article
                      key={insight.title}
                      ref={(node) => {
                        scientificBlockRefs.current[index] = node;
                      }}
                      data-insight-index={index}
                      className={`insight-block ${visibleScientificIndices[index] ? "is-visible" : ""} ${activeScientificIndex === index ? "is-active" : ""}`}
                    >
                      <p className="insight-tag">Insight {index + 1}</p>
                      <h3>{insight.title}</h3>
                      <p>{insight.description}</p>
                    </article>
                  ))}

                  <p className="scientific-end-message">
                    Every discovery brings us closer to understanding Mars — and our place beyond
                    Earth.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
