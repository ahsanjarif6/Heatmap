
async function fetchData() {
    try{
        const handle = document.getElementById("handle").value;
        const response = await fetch(`https://codeforces.com/api/user.status?handle=${handle}&from=1&count=100000`);

        if(!response.ok){
            alert("No user with this handle")
            throw new Error("No user with this handle")
        }

        const res = await response.json();
        const result = res.result;
        let problemList = [];
        for(let i=0;i<result.length;i++){
            if(result[i].verdict === "OK"){
                problemList.push({
                    creationTimeSeconds: result[i].creationTimeSeconds,
                    rating: result[i].problem.rating
                });
            }
        }
        

        const submissions = {};

        for (const submission of problemList) {
            const date = new Date(submission.creationTimeSeconds * 1000).toISOString().slice(0, 10); // YYYY-MM-DD format

            if (submission.rating !== undefined) {
                if (!submissions[date] || submission.rating > submissions[date].value) {
                    submissions[date] = { date: date, value: submission.rating };
                }
            }
        }

        const data = Object.values(submissions);

        const dataLookup = {};
        data.forEach((entry) => {
            dataLookup[entry.date] = entry.value;
        });

        function getColor(rating) {
            if (rating <= 1199) return "grey";
            if (rating <= 1399) return "green";
            if (rating <= 1599) return "cyan";
            if (rating <= 1899) return "blue";
            if (rating <= 2099) return "purple";
            if (rating <= 2299) return "yellow";
            if (rating <= 2399) return "orange";
            if (rating <= 2599) return "red";
            if (rating <= 2999) return "#c10a0a";
            return "maroon";
        }

        const minDate = d3.min(data, (d) => new Date(d.date));
        const maxDate = new Date();
        const minYear = minDate.getUTCFullYear();
        const maxYear = maxDate.getUTCFullYear();

        const svg = d3.select("#heatmap");

        svg.selectAll("*").remove();
        
        const width = 990;
        const cellSize = 17;
        const yearHeight = cellSize * 9; 

        svg
            .attr("width", width)
            .attr("height", yearHeight * (maxYear - minYear + 1)) 
            .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;");

        const years = d3.range(minYear, maxYear + 1);
        const yearGroup = svg
            .selectAll("g")
            .data(years)
            .enter()
            .append("g")
            .attr("transform", (d, i) => `translate(40.5,${yearHeight * i + cellSize * 1.5})`);

        yearGroup
            .append("text")
            .attr("x", -5)
            .attr("y", -5)
            .attr("font-weight", "bold")
            .attr("text-anchor", "end")
            .text((d) => d);

        yearGroup
            .append("g")
            .selectAll("text")
            .data(["S", "M", "T", "W", "T", "F", "S"])
            .enter()
            .append("text")
            .attr("x", -10)
            .attr("y", (d, i) => (i + 0.5) * cellSize)
            .attr("dy", "0.31em")
            .text((d) => d);

        yearGroup
            .selectAll(".day")
            .data((year) => d3.timeDays(new Date(year, 0, 1), new Date(year + 1, 0, 1)))
            .enter()
            .append("rect")
            .attr("class", "day")
            .attr("width", cellSize - 1)
            .attr("height", cellSize - 1)
            .attr("x", (d) => d3.timeWeek.count(d3.timeYear(d), d) * cellSize + 0.5)
            .attr("y", (d) => d.getDay() * cellSize + 0.5)
            .attr("fill", (d) => {
                const value = dataLookup[d3.timeFormat("%Y-%m-%d")(d)];
                return value !== undefined ? getColor(value) : "white";
            })
            .attr("stroke", "#ccc")
            .append("title")
            .text((d) => {
                const date = d3.timeFormat("%Y-%m-%d")(d);
                const value = dataLookup[date];
                return value !== undefined ? `${date}: ${value}` : `${date}: No data`;
            });

        yearGroup
            .append("g")
            .selectAll("g")
            .data((year) => d3.utcMonths(new Date(year, 0, 1), new Date(year + 1, 0, 1)))
            .enter()
            .append("g")
            .call((monthGroup) => {
                monthGroup
                    .filter((d, i) => i)
                    .append("path")
                    .attr("fill", "none")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 1)
                    .attr("d", pathMonth);

                monthGroup
                    .append("text")
                    .attr("x", (d) => d3.timeWeek.count(d3.timeYear(d), d3.timeWeek.ceil(d)) * cellSize + 2)
                    .attr("y", -5)
                    .text(d3.timeFormat("%b"));
            });

        function pathMonth(t) {
            const d = Math.max(0, Math.min(5, t.getDay()));
            const w = d3.timeWeek.count(d3.timeYear(t), t);
            return `${d === 0 ? `M${w * cellSize},0`
                : d === 5 ? `M${(w + 1) * cellSize},0`
                : `M${(w + 1) * cellSize},0V${d * cellSize}H${w * cellSize}`}V${6 * cellSize}`;
        }



    }catch(error){
        console.log(error);
    }
}


document.getElementById("handle").addEventListener("keypress", async function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        await fetchData();
    }
  }); 