console.log("Script is running");

let wavePaths = [];
let dotGroups = [];
let wavesAnimated = false;

d3.csv("mood-tracker.csv", d3.autoType).then(data => {

  const parseDate = d3.timeParse("%m-%d-%Y");

  data.forEach(d => {
    d.date = parseDate(d.date);
  });

  data.sort((a, b) => a.date - b.date);

  const january = data.filter(d => d.date.getMonth() === 0);

  createJanuaryWaves(january);
  setupScrollAnimation();

});

function createJanuaryWaves(data) {

  const width = window.innerWidth;
  const height = window.innerHeight + 200;

  const svg = d3.select("#jan-viz")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const weeks = [
    data.slice(0,7),
    data.slice(7,14),
    data.slice(14,21),
    data.slice(21)
  ];

  const x = d3.scaleLinear()
    .domain([0, 6])
    .range([100, width - 100]);

  const amplitudeScale = d3.scaleLinear()
    .domain([0, 10])
    .range([0, height * 0.85]);

  const baseCenter = height / 2;

  // 🎨 COLOR SCALE (low = dark, high = light)
  const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([10, 0]); // reversed so low = dark

  weeks.forEach((week, i) => {

    const baseline = baseCenter + (i - 1.5) * 120;

    const extendedWeek = [
      { ...week[0], fakeIndex: -0.4 },
      ...week.map((d, idx) => ({ ...d, fakeIndex: idx })),
      { ...week[week.length - 1], fakeIndex: 6.4 }
    ];

    const area = d3.area()
      .x(d => x(d.fakeIndex))
      .y0(d => baseline + amplitudeScale(d["overall-positive-day-score"]) / 2)
      .y1(d => baseline - amplitudeScale(d["overall-positive-day-score"]) / 2)
      .curve(d3.curveCatmullRom.alpha(0.5));

    // 🌊 Start hidden below
    const path = svg.append("path")
      .datum(extendedWeek)
      .attr("d", area)
      .attr("fill", d3.interpolateBlues(0.4 + i * 0.12))
      .attr("opacity", 0)
      .attr("transform", `translate(0, ${height})`);

    wavePaths.push(path);

    // 🔵 DOTS — color based on score value
    const dots = svg.selectAll(`.dot-${i}`)
      .data(week)
      .enter()
      .append("circle")
      .attr("cx", (d, index) => x(index))
      .attr("cy", d =>
        baseline - amplitudeScale(d["overall-positive-day-score"]) / 2
      )
      .attr("r", 7)
      .attr("fill", d =>
        colorScale(d["overall-positive-day-score"])
      )
      .attr("opacity", 0);

    dotGroups.push(dots);

    dots
      .on("mouseover", function(event, d) {
        d3.select("#tooltip")
          .style("opacity", 1)
          .html(`
            <strong>${d3.timeFormat("%B %d, %Y")(d.date)}</strong><br/>
            Overall Score: ${d["overall-positive-day-score"]}<br/>
            Anxiety: ${d["anxiety-level"]}<br/>
            Energy: ${d["energy-level"]}
          `);
      })
      .on("mousemove", function(event) {
        d3.select("#tooltip")
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 30) + "px");
      })
      .on("mouseout", function() {
        d3.select("#tooltip").style("opacity", 0);
      });

  });

}

function setupScrollAnimation() {

  const januarySection = document.querySelector(".january");
  const februarySection = document.querySelector(".february");
  const marchSection = document.querySelector(".march");

  const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

      if (entry.isIntersecting) {

        // 🌊 JANUARY
        if (entry.target.classList.contains("january")) {

          document.body.classList.remove("pink", "march");
          document.body.classList.add("ocean");

          if (!wavesAnimated) {
            wavesAnimated = true;

            wavePaths.forEach((path, i) => {
              path.transition()
                .delay(i * 200)
                .duration(1200)
                .ease(d3.easeCubicOut)
                .attr("opacity", 0.95)
                .attr("transform", "translate(0,0)");
            });

            dotGroups.forEach((dots, i) => {
              dots.transition()
                .delay(800 + i * 200)
                .duration(600)
                .attr("opacity", 0.95);
            });
          }
        }

        // FEBRUARY
        if (entry.target.classList.contains("february")) {
          document.body.classList.remove("ocean", "march");
          document.body.classList.add("pink");
          startBubbles();
        } else {
          stopBubbles();
        }

        // MARCH
        if (entry.target.classList.contains("march")) {
          document.body.classList.remove("ocean", "pink");
          document.body.classList.add("march");
        }

      } else {

        if (entry.target.classList.contains("january")) {
          document.body.classList.remove("ocean");
        }

        if (entry.target.classList.contains("february")) {
          document.body.classList.remove("pink");
        }

        if (entry.target.classList.contains("march")) {
          document.body.classList.remove("march");
        }

      }

    });

  }, { threshold: 0.4 });

  observer.observe(januarySection);
  observer.observe(februarySection);
  observer.observe(marchSection);
}

// into pic fade-in on load
window.addEventListener("load", () => {
  setTimeout(() => {
    document.querySelector(".intro").classList.add("rainbow-visible");
  }, 200);
});

//jellyfish animation for february section

const febSection = document.querySelector(".february");
const marchSection = document.querySelector(".march");

window.addEventListener("scroll", () => {
  const febRect = febSection.getBoundingClientRect();
  const marchRect = marchSection.getBoundingClientRect();

  const windowHeight = window.innerHeight;

  // If February is in view
  if (febRect.top < windowHeight * 0.6 && febRect.bottom > 0) {
    febSection.classList.add("active");
    febSection.classList.remove("exit");
  }

  // If March enters view
  if (marchRect.top < windowHeight * 0.6) {
    febSection.classList.remove("active");
    febSection.classList.add("exit");
  }
});


//bubble animation for february section

const bubbleContainer = document.querySelector(".bubble-container");
let bubbleInterval = null;

function createBubble() {
  const bubble = document.createElement("img");
  bubble.src = "bubble.png";
  bubble.classList.add("bubble");

  const size = Math.random() * 30 + 15;
  bubble.style.width = size + "px";

  bubble.style.left = Math.random() * window.innerWidth + "px";

  const duration = Math.random() * 5 + 6;
  bubble.style.animationDuration = duration + "s";

  bubbleContainer.appendChild(bubble);

  setTimeout(() => {
    bubble.remove();
  }, duration * 1000);
}

function startBubbles() {
  if (!bubbleInterval) {
    bubbleInterval = setInterval(createBubble, 400);
  }
}

function stopBubbles() {
  clearInterval(bubbleInterval);
  bubbleInterval = null;

  // remove any existing bubbles immediately
  bubbleContainer.innerHTML = "";
}