let configureLabels = function(options){
  let labels = [];
  options.labels.forEach((label)=>{
    labels.push({
      fillStyle: "#222222",
      font: "22px Arial",
      ...label
    });
  });
  return labels;
};

let configureData = function(options){
  let data = [];
  options.data.forEach((set)=>{
    data.push({
      fill: false,
      fillStyle: set.color || " rgba(5, 143, 196, 0.25)",
      pathLineWidth: 4,
      pathStrokeStyle: set.color || "#058fc4",
      pointFillStyle: set.color || "#058fc4",
      pointRadius: 5,
      ...set
    });
  });
  return data;
};

let configureGrid = function(ctx, options){
  let grid = {
    axes: [],
    options: {
      font: "18px Arial",
      innerLines: 1,
      lineWidth: 0.5,
      max: 10,
      strokeStyle: "#555555",
      ...options.grid
    }
  };

  let canvasWidth = ctx.canvas.width;
  let canvasHeight = ctx.canvas.height;
  grid.center = {x: canvasWidth / 2, y: canvasHeight / 2};
  grid.radius = (canvasWidth > canvasHeight ? canvasHeight : canvasWidth) / 3.1;

  for(let axis = 0; axis < options.labels.length; axis++){
    grid.axes.push({
      angle: (2 * Math.PI * axis / options.labels.length) + 1/2 * Math.PI
    });
  }

  return grid;
};

export default class CanvasRadarChart{
  constructor(ctx, options){
    this.ctx = ctx;
    this.data = configureData(options);
    this.labels = configureLabels(options);
    this.grid = configureGrid(ctx, options);

    this.renderGrid();
    this.renderLabels();
    this.renderData();
  }

  resize(){
    let canvas = this.ctx.canvas;
    let container = canvas.parentNode;
    let newWidth = container.clientWidth;
    let aspectRatio = canvas.width / canvas.height;
    canvas.style.width = newWidth + "px";
    canvas.style.height = (newWidth / aspectRatio) + "px";
  }

  renderGrid(){
    let innerLines = this.grid.options.innerLines;

    for(let line = 0; line <= innerLines + 1; line++){
      this.renderPolygon(this.grid.radius * (line/(innerLines + 1)), line);
    }
  }

  renderPolygon(radius, line){
    let options = this.grid.options;

    this.ctx.strokeStyle = options.strokeStyle;
    this.ctx.lineWidth = options.lineWidth;
    this.ctx.beginPath();

    this.grid.axes.concat(this.grid.axes[0]).forEach((axis, index)=>{
      let x = this.grid.center.x + radius * -Math.cos(axis.angle);
      let y = this.grid.center.y + radius * -Math.sin(axis.angle);

      if(index === 0){
        let scale = parseInt(options.max * (line / (options.innerLines + 1)), 10);
        this.ctx.font = options.font;
        this.ctx.fillText(scale, x + 5, y + 20);
      }

      this.ctx.lineTo(x, y);
      if(radius === this.grid.radius){
        this.ctx.lineTo(this.grid.center.x, this.grid.center.y);
        this.ctx.moveTo(x, y);
      }
    });

    this.ctx.closePath();
    this.ctx.stroke();
  }

  renderLabels(){
    this.grid.axes.forEach((axis, index)=>{
      let label = this.labels[index];
      let img = new Image();
      img.src = label.image;
      img.onload = ()=>{
        let diagonal = Math.sqrt((Math.pow(img.width, 2) + Math.pow(img.height, 2)));
        let x = (this.grid.center.x - img.width / 2) + (this.grid.radius + (diagonal / 2) * 1.10) * -Math.cos(axis.angle);
        let y = (this.grid.center.y - img.height / 2) + (this.grid.radius + (diagonal / 2) * 1.10) * -Math.sin(axis.angle);
        this.ctx.drawImage(img, x, y);

        this.renderLabelText(label, x + img.width / 2, y + img.height);
      };
    });
  }

  renderLabelText(label, x, y){
    this.ctx.fillStyle = label.fillStyle;
    this.ctx.font = label.font;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "top";
    let textLength = this.ctx.measureText(label.text).width;

    if(x < 150 || x > 680){
      let lines = label.text.split(" ");
      if(lines.length > 1){
        for(let i = 0; i < lines.length; i++){
          this.ctx.fillText(lines[i], x, y + (i * 22));
        }
      }else if(textLength > 145 && x < 150){
        this.ctx.fillText(label.text, x - 20, y);
      }else if(textLength > 145 && x > 680){
        this.ctx.fillText(label.text, x + 20, y);
      }else{
        this.ctx.fillText(label.text, x, y);
      }
    }else{
      this.ctx.fillText(label.text, x, y);
    }
  }

  renderData(){
    this.data.forEach((data)=>{
      let points = [];

      this.ctx.strokeStyle = data.pathStrokeStyle;
      this.ctx.lineWidth = data.pathLineWidth;
      this.ctx.beginPath();
      this.grid.axes.forEach((axis, index)=>{
        let value = this.grid.radius * data.values[index] / this.grid.options.max;
        let x = this.grid.center.x + value * -Math.cos(axis.angle);
        let y = this.grid.center.y + value * -Math.sin(axis.angle);
        points.push({x, y});
        this.ctx.lineTo(x, y);
      });
      this.ctx.closePath();

      if(data.fill){
        this.ctx.fillStyle = data.fillStyle;
        this.ctx.fill();
      }
      this.ctx.stroke();

      this.ctx.fillStyle = data.pointFillStyle;
      points.map(point=>{
        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, data.pointRadius, 0, 2 * Math.PI, false);
        this.ctx.fill();
      });
    });
  }
}