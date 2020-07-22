const Visuals = {}

Visuals.showHideConditionals = function(condition) {

  // 'basic' --> noAI condition

  // should be hidden by default
  Visuals.hide('.lvl-one')
  Visuals.hide('.lvl-two')
  Visuals.hide('.lvl-three')
  Visuals.hide('.lvl-four')

  if(condition == "ai") {          // AI condition: ai
    Visuals.show('.lvl-one')
  }
  if(condition == "attention") {    // XAI: attention  (old: intermediate)
    Visuals.show('.lvl-two')
  }
  if(condition == "attribute") {          // XAI: attribute
    Visuals.show('.lvl-three')
  }
  if(condition == "expert") {          // XAI: attention+attribute
    Visuals.show('.lvl-four')
  }
}

Visuals.hide = function(query) {
  let selection = $(query);
  for(let elem of selection) {
    elem.classList.remove('visible')
    elem.classList.add('hidden')
  }
}

Visuals.show = function(query) {
  let selection = $(query);
  for(let elem of selection) {
    elem.classList.remove('hidden')
    elem.classList.add('visible')
  }
}

Visuals.fixFancyBars = function() {
  let fancyNums = $('.fancy-number');
  for(let num of fancyNums) {
    let n = Math.round(parseFloat(num.innerHTML) * 100)
    // round the number
    num.innerText = n + '%'
    num.dataset.numValue = n;

    let color = Visuals.interpolateColor( [179, 42, 37], [0, 51, 153], n/100 )
    num.style.backgroundColor = 
      "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")"
  }
}
 
Visuals.fixFancyNumbers = function() {
  let fancyNums = $('.fancy-number');
  // console.log(fancyNums)
  // #{topic.confidences.overall}
  for(let num of fancyNums) {
    let n = Math.round(parseFloat(num.innerHTML) * 100)
    //console.log(n);
    // round the number
    if (n > 9)
      num.innerText = n + '%'
    else
      num.innerText = n + ' %'
    
    num.dataset.numValue = n;

    let color = Visuals.interpolateColor( [179, 42, 37], [0, 51, 153], n/100 )
    num.style.backgroundColor =
      "rgb(" + color[0] + "," + color[1] + "," + color[2] + ")"
  }
}


Visuals.interpolateColor = function(color1, color2, factor) {
    if (arguments.length < 3) { factor = 0.5; }
    
    var result = color1.slice();
    for (var i=0;i<3;i++) {
      result[i] = Math.round(result[i] + factor*(color2[i]-color1[i]));
    }
    return result;
}

Visuals.colorText = function() {
  let predicitonTexts = $('.true-false-text');
   this_lvl = taskRun.condition_order[taskRun.current_condition]
   

  for(let text of predicitonTexts)
  {
    labels = text.innerHTML.split(" ")

    // #{topic.prediction_overall} #{topic.prediction_2_3} #{topic.prediction_1_4}
    
    if (this_lvl == 'ai'){                // lvl-one
      text.innerHTML = labels[0]
    }else if (this_lvl == "attention"){   // 'lvl-two'
      text.innerHTML = labels[2]
    }else if (this_lvl == 'attribute'){   // lvl-three
      text.innerHTML = labels[1]
    }if (this_lvl == 'expert'){           // lvl-four
      text.innerHTML = labels[0]
    } 

    text.style.backgroundColor = Visuals.getGoodColor(text.innerHTML)
  }
}

Visuals.getGoodColor = function(cred) {
  switch(cred){
    case "True": return "#23ad65";
    case "Mostly True": return "#72ad3a";
    case "Mostly Fake": return "#b36b25";
    case "Fake" : return "#b32a25";
  }
  return "white";
}


Visuals.addNumberDescriptions = function() {
  let numDescriptions = $('.number-description');
  for(let desc of numDescriptions) {
    let value = desc.previousSibling.dataset.numValue;

    //console.log(desc.classList)
    //console.log(value)

    let text = 'maybe something'

    if(desc.classList[1] == 'article-relevance')
      text = Visuals.percentageDescription(value, 'relevant')
    if(desc.classList[1] == 'article-importance')
      text = Visuals.percentageDescription(value, 'important')
    if(desc.classList[1] == 'article-quality')
      text = Visuals.percentageDescription_GreatToHorrible(value, 'quality')
    if(desc.classList[1] == 'source-credibility')
      text = Visuals.percentageDescription(value, 'credible')
    if(desc.classList[1] == 'source-relevance')
      text = Visuals.percentageDescription(value, 'relevant')

    desc.innerText = text;
  }
}

Visuals.removeDescriptions = function() {
  let numDescriptions = $('.number-description');
  for(let desc of numDescriptions) {
    let value = desc.previousSibling.dataset.numValue;
    desc.innerText = ""
    //console.log(desc.classList)
    //console.log(value)

    // let text = 'maybe something'

    // if(desc.classList[1] == 'article-relevance')
    //   text = Visuals.percentageDescription(value, 'relevant')
    // if(desc.classList[1] == 'article-importance')
    //   text = Visuals.percentageDescription(value, 'important')
    // if(desc.classList[1] == 'article-quality')
    //   text = Visuals.percentageDescription_GreatToHorrible(value, 'quality')
    // if(desc.classList[1] == 'source-credibility')
    //   text = Visuals.percentageDescription(value, 'credible')
    // if(desc.classList[1] == 'source-relevance')
    //   text = Visuals.percentageDescription(value, 'relevant')

    // desc.innerText = text;
  }
}

Visuals.percentageDescription = function(value, attribute) {
  if(value >= 90) return "Highly " + attribute;

  if(value >= 80) return "Very " + attribute;

  if(value >= 70) return  attribute[0].toUpperCase() + attribute.slice(1);

  if(value >= 60) return "Somewhat " + attribute;

  if(value >= 50) return "Just a little " + attribute;

  if(value >= 40) return "Barely " + attribute;

  if(value >= 30) return "Possibly " + attribute;

  if(value >= 20) return "Not " + attribute;

  return "Not "+attribute+" at all";
}

Visuals.percentageDescription_GreatToHorrible = function(value, attribute) {
  if(value >= 90) return "Great " + attribute;

  if(value >= 80) return "Very good " + attribute;

  if(value >= 70) return  "Good " + attribute;

  if(value >= 60) return "OK " + attribute;

  if(value >= 50) return "So-so " + attribute;

  if(value >= 40) return "Questionable " + attribute;

  if(value >= 30) return "Not very good " + attribute;

  if(value >= 20) return "Bad " + attribute;

  return "Horrible " + attribute;
}

Visuals.toggleExplainable_all = function(event) {

  let explainable_list = document.getElementsByClassName('articleImp')

  let opened=true;

  var unix = Math.round(+new Date()/1000);

  for(let each_elem of explainable_list) {
    opened = Visuals.toggleOpenClosed(each_elem)
  };


  if(opened) {
    axios.post('/log/', {
        action: "show-explanation",
        info: {
          topic: TOPICDATA.claim_id,
          // article: explainable.dataset.articleid,
          explainable: explainable_list[0].dataset.explainable,
          timestamp: unix
        }
      }
    );
  } else {  
    axios.post('/log/', {
        action: "hide-explanation",
        info: {
          topic: TOPICDATA.claim_id,
          // article: explainable.dataset.articleid,
          explainable: explainable_list[0].dataset.explainable,
          timestamp: unix
        }
      }
    );
  }
}

Visuals.toggleExplainable = function(event) {
  let explainable = event.target;
  
  while(!explainable.classList.contains('article-explainable'))
  {
    explainable = explainable.parentElement
  }

  // --- new:  Toggle same exp. on all articles: 
  all_exp = ['articleImp','articleRel','articleQly','sourceCrd','sourceRel']
  
  let the_exp='articleImp';  
  for(let each_exp of all_exp) {  
    if (explainable.classList.contains(each_exp)) {
      let the_exp = each_exp; 
      var unix = Math.round(+new Date()/1000);

      let explainable_list = document.getElementsByClassName(the_exp)

      for(let each_elem of explainable_list) {
        opened = Visuals.toggleOpenClosed(each_elem)

      };

      if(opened) {
        axios.post('/log/', {
            action: "show-explanation",
            info: {
              topic: TOPICDATA.claim_id,
              explainable: explainable_list[0].dataset.explainable,
              timestamp: unix
            }
          }
        );
      } else {  
        axios.post('/log/', {
            action: "hide-explanation",
            info: {
              topic: TOPICDATA.claim_id,
              explainable: explainable_list[0].dataset.explainable,
              timestamp: unix
            }
          }
        );
      }

    }
  }

  // // -- old: 
  // let opened = Visuals.toggleOpenClosed(explainable)
  // if(opened) {
  //   axios.post('/log/', {
  //       action: "show-explanation",
  //       info: {
  //         topic: TOPICDATA.claim_id,
  //         article: explainable.dataset.articleid,
  //         explainable: explainable.dataset.explainable
  //       }
  //     }
  //   );
  // } else {
  //   axios.post('/log/', {
  //       action: "hide-explanation",
  //       info: {
  //         topic: TOPICDATA.claim_id,
  //         article: explainable.dataset.articleid,
  //         explainable: explainable.dataset.explainable
  //       }
  //     }
  //   );
  // }
}


Visuals.toggleExplainable_artcle = function(event) {
  let explainable = event.target;
  
  while(!explainable.classList.contains('article-explainable'))
  {
    explainable = explainable.parentElement
  }

  var unix = Math.round(+new Date()/1000);

    // -- old: 
  let opened = Visuals.toggleOpenClosed(explainable)
  if(opened) {
    axios.post('/log/', {
        action: "show-explanation",
        info: {
          topic: TOPICDATA.claim_id,
          article: explainable.dataset.articleid,
          explainable: explainable.dataset.explainable,
          timestamp: unix
        }
      }
    );
  } else {
    axios.post('/log/', {
        action: "hide-explanation",
        info: {
          topic: TOPICDATA.claim_id,
          article: explainable.dataset.articleid,
          explainable: explainable.dataset.explainable,
          timestamp: unix
        }
      }
    );
  }
}

Visuals.toggleOpenClosed = function(element) {
  
  if(element.classList.contains('closed'))
  {
    element.classList.remove('closed')
    element.classList.add('open')
    return true
    
  }  else  {
    
    element.classList.remove('open')
    element.classList.add('closed')
    return false
  }
  return false
}


Visuals.showPie = function(event) {
  
  
  let explainable = event.target;
  
      
      while(!explainable.classList.contains('article-explainable'))
      {
        explainable = explainable.parentElement
      }

      var unix = Math.round(+new Date()/1000);


      opened = Visuals.toggleOpenClosed(explainable)
      var article_imp_tot = explainable.getAttribute('art_imp_tot');
      var article_rel = explainable.getAttribute( 'art_imp_clm' );
      var article_imp = explainable.getAttribute( 'article_imp' );
      var claim_source_imp = explainable.getAttribute( 'claim_source_imp' );
      var article_source = explainable.getAttribute( 'article_source' );
      var article_id = explainable.getAttribute( 'data-articleid' );

      // console.log('---- here: ', article_imp_tot)

      if(opened) {
        pieVisualization(explainable, article_imp_tot, article_rel,article_imp,claim_source_imp,article_source,article_id)
      }else{
        // d3.selectAll("svg.pieChart").remove()
        d3.selectAll("svg.pieChart-" + article_id).remove();
        d3.selectAll("div.tooltip").remove();
        
      }      

    if(opened) {
      axios.post('/log/', {
          action: "show-explanation",
          info: {
            topic: TOPICDATA.claim_id,
            explainable: explainable.dataset.explainable,
            timestamp: unix
          }
        }
      );
    } else {  
      axios.post('/log/', {
          action: "hide-explanation",
          info: {
            topic: TOPICDATA.claim_id,
            explainable: explainable.dataset.explainable,
            timestamp: unix
          }
        }
      );
    }
 
    
}


 function pieVisualization(each_elem,article_imp_tot,article_rel,article_imp,claim_source_imp,article_source,article_id){

          data =[]

          data.push({"label":"Source ", "value":article_source})
          data.push({"label":"Claim ", "value":article_rel }) 
          data.push({"label":"Text ", "value":article_imp})
          // data.push({"label":"Domain ", "value":claim_source_imp})
          
          // var clientHeight = document.getElementById('each_elem') ;
          var this_w = document.getElementById('button-row').clientWidth // article-explainable
          var this_h = document.getElementById('button-row').clientHeight // article-explainable

          // console.log(this_w)

          var width = this_w,
          height = 180,
          radius = Math.min(width, height) / 2;

          // Define the div for the tooltip
          var div = d3.select("body").append("div") 
              .attr("class", "tooltip")       
              .style("opacity", 0);
          
          chart_clearance = 20

          trans_X = chart_clearance + width / 2;
          trans_Y = height / 2;
          svg = d3.select(each_elem) //  body
              .append("svg")
              .attr("class", "container") 
              .attr("class", function(d,i) { return "pieChart-" + article_id; })
              .attr("width", width)           
              .attr("height", height)
              .append("g")
              .attr("transform", "translate(" + trans_X + "," + trans_Y + ")");
       
          svg.append("g")
              .attr("class", "slices");
          svg.append("g")
              .attr("class", "labels");
          svg.append("g")
              .attr("class", "lines");


          var pie = d3.layout.pie()
              .sort(null)
              .value(function(d) {
                  return d.value;
              });

      var arc = d3.svg.arc()
          .outerRadius(radius * 0.8)
          .innerRadius(radius * 0.4);

      var outerArc = d3.svg.arc()
          .innerRadius(radius * 0.9)
          .outerRadius(radius * 0.9);

      var key = function(d){ return d.data.label; };

      color = d3.scale.category10();
      color_pie = d3.scale.category10().range(['#ff7f0e', '#1f77b4', '#2ca02c', '#9467bd']);

 /* ------- PIE SLICES -------*/
    var slice = svg.select(".slices").selectAll("path.slice")
        .data(pie(data), key);

    slice.enter()
        .insert("path")
        // .style("fill", function(d,i) { new_c = parseInt(i) + 1; console.log("color: "+  new_c); return color(new_c+3); })
        .style("fill", function(d) {return color_pie(d.data.label); })
        .attr("class", "slice")
        .attr("opacity",0.8)
        .attr('stroke-width', '2px')
          .on("mouseover", function(d) {
               

               let g = d3.select(this)
                    .style("cursor", "pointer")
                    .attr("opacity",1.0);

              g.append("text")
                    .attr("class", "name-text")
                    .text('XXX')
                    .attr('text-anchor', 'middle')
                    .attr('dy', '-1.2em');

                  this_score = Math.floor(d.data.value * 100);
                  this_color =  color(2 * d.data.label);

                  div.transition()    
                    .duration(100)    
                    .style("opacity", 1.0);                    

                  div.html(d.data.label+" importance: "+this_score+"%")  
                      .style("background", function(d) { return this_color; })
                      .style("left", (d3.event.pageX) + "px")   
                      .style("top", (d3.event.pageY - 28) + "px");  

                })
              .on("mouseout", function(d) {
                  d3.select(this)
                    .style("cursor", "none")  
                    .attr("opacity",0.8);
                    // .select(".text-group").remove();
                    div.transition()    
                        .duration(200)    
                        .style("opacity", 0); 
                })


svg.append('text')
  .attr('text-anchor', 'middle')
  .attr('dy', '.35em')
  .text(text);

    slice       
        .transition().duration(1000)
        .attrTween("d", function(d) {
            this._current = this._current || d;
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                return arc(interpolate(t));
            };
        })

    slice.exit()
        .remove();

    /* ------- TEXT LABELS -------*/

    var text = svg.select(".labels").selectAll("text")
        .data(pie(data), key);

    text.enter()
        .append("text")
        .attr("dy", ".35em")
        .text(function(d) {
            return d.data.label// + ": "+ d.data.value;
        });
    
    function midAngle(d){
        return d.startAngle + (d.endAngle - d.startAngle)/2;
    }

    text.transition().duration(100)
        .attrTween("transform", function(d) {
            this._current = this._current || d;
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                var d2 = interpolate(t);
                var pos = outerArc.centroid(d2);
                pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
                return "translate("+ pos +")";
            };
        })
        .styleTween("text-anchor", function(d){
            this._current = this._current || d;
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                var d2 = interpolate(t);
                return midAngle(d2) < Math.PI ? "start":"end";
            };
        });

    text.exit()
        .remove();

    /* ------- SLICE TO TEXT POLYLINES -------*/

    var polyline = svg.select(".lines").selectAll("polyline")
        .data(pie(data), key);
        
    
    polyline.enter()
        .append("polyline")
        .attr('opacity',0.3)
        .attr('stroke', 'black')
        .attr('stroke-width', '2px')
        .attr('fill','none');

    polyline.transition().duration(1000)
        .attrTween("points", function(d){
            this._current = this._current || d;
            var interpolate = d3.interpolate(this._current, d);
            this._current = interpolate(0);
            return function(t) {
                var d2 = interpolate(t);
                var pos = outerArc.centroid(d2);
                pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
                return [arc.centroid(d2), outerArc.centroid(d2), pos];
            };          
        });
    
    polyline.exit()
        .remove();

          // ---------------------------------------------------
          // -------------------- Bar chart --------------------
          // ---------------------------------------------------
      AI_2 = true
      if (AI_2){ 
              // imp_tot = [{"key":"AI-1", "value":0.2 }, {"key":"AI-2", "value":1.0 }]  //  , {"key":"AI2", "value":1.0 }, {"key":"AI3", "value":0.8 }
              imp_tot = [{"key":"", "value":article_imp_tot }]  // AI-1
              // console.log(imp_tot) 
      
              var margin = {top: 5, right: 5, bottom: 20, left: 55 },  // bottom: 55
                  width_n = (imp_tot.length * 20 + 60) - margin.left - margin.right,
                  height_n = height - margin.top - margin.bottom;
      
              var x = d3.scale.ordinal().rangeRoundBands([0, width_n], .05);
              var y = d3.scale.linear().range([height_n, 0]);
      
              var xAxis = d3.svg.axis()
                  .scale(x)
                  .tickSize(0);
                  // .tickFormat("");
                  // .orient("bottom")
                  // .outerTickSize(0)

      
              var yAxis = d3.svg.axis()
                  .scale(y)
                  .orient("left")
                  .ticks(4, "%");
      
                x.domain(imp_tot.map(function(d) { return d.key; }));
                y.domain([0,1]); // .domain([0, d3.max(imp_tot, function(d) { return d.value; })]);
                trans_x = margin.left -1*width / 2 - chart_clearance
                trans_y = margin.top -1*height / 2
      
                svg.append("g")
                    .attr("transform", "translate(" + trans_x + "," + (height_n + trans_y) + ")")
                    .attr("class", "x axis")
                    .call(xAxis);
                  // .selectAll("text")
                  //   .style("text-anchor", "end")
                  //   .style("font-weight", 'bold')
                  //   .style("font-style ", 'italic')
                  //   .attr("dx", "-.8em")
                  //   .attr("dy", "-.55em")
                  //   .attr("transform", "rotate(-90)" );
                    // .outerTickSize(0);

      
                svg.append("g")
                    .attr("transform", "translate(" +trans_x + "," + trans_y + ")")
                    .attr("class", "y axis")
                    .call(yAxis)
                  .append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("x", 5)
                    .attr("y", 0)
                    .attr("dx", "-1.0em")
                    .attr("dy", "-3em")
                    .style("text-anchor", "end")
                    .style("font-weight", 'bold')
                    .text("Article Importance");
      
                svg.selectAll("bar")
                    .data(imp_tot)
                  .enter().append("rect")
                    .attr("transform", "translate(" + trans_x + "," + trans_y + ")")
                    .style("fill", "steelblue")
                    .attr("x", function(d) { return x(d.key); })
                    .attr("width", x.rangeBand())
                    .attr("y", function(d) { return y(d.value); })
                    .attr("height", function(d) { return height_n - y(d.value); })
                    .on("mouseover", function(d) {

                           let g = d3.select(this)
                                .style("cursor", "pointer")
                                .attr("opacity",1.0);
                          div.transition()    
                            .duration(100)    
                            .style("opacity", 1.0);                    
                          div.html("Article Importance: ")  
                              .style("left", (d3.event.pageX) + "px")   
                              .style("top", (d3.event.pageY - 28) + "px");  
                          })
                    .on("mouseout", function(d) {
                        d3.select(this)
                          .style("cursor", "none")  
                          .attr("opacity",0.8);
                          div.transition()    
                              .duration(200)    
                              .style("opacity", 0); 
                      });
          

          }
}