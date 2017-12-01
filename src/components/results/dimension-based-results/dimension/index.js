import {h, Component} from "preact";
import Color from "color-helpers";
import style from "./style";

export default class Dimension extends Component{
  constructor(props){
    super(props);
    this.state = {showContent: props.index === 0};
    this.trigger = this.trigger.bind(this);
  }
  trigger(e){
    e.preventDefault();

    this.props.triggerCallback("Dimension", "showContent", this, this.props.personalityType.personality_type);
    this.setState({showContent: !this.state.showContent});
  }
  componentDidMount(){
    this.props.triggerCallback("Dimension", "initialized", this);
  }
  description(suffix){
    let type = this.props.personalityType.personality_type;
    let perspective = (this.props.perspective || "firstPerson").replace("Person", "");
    let description = type.details.find(detail=>detail.title === `${perspective}_person_${suffix}`);
    description = description && description.body;
    if(description){ return description; }
    description = type.details.find(detail=>detail.title === `${perspective}_person_${suffix}`);
    return (description && description.body) || type.description;
  }
  render(){
    let type = this.props.personalityType.personality_type;
    let benefits = [];
    let pitfalls = [];
    type.details.forEach((detail)=>{
      if(detail.title === "Benefits") benefits.push(detail.body);
      if(detail.title === "Pitfalls") pitfalls.push(detail.body);
    });
    let color = `#${type.badge.color_1}`;

    return (
      <li class={style.dimension}>
        <div class={style.main} style={`background: ${Color.rgba(color, 8.5)};border-left: 5px solid ${color};`}>
          <div class={style.side}>
            <p class={style.icon}>
              <img src={type.badge.image_medium} alt={type.name} />
            </p>
          </div>
          <div class={style.content}>
            <h4 class={style.title}>{type.name} <span style={`color: ${color}`}>|</span> {this.props.personalityType.score} - {type.level}</h4>
            <p class={style.description}>{this.description("short_description")}</p>
            <p class={style.triggerButton}><a class={style.trigger} style={`background: ${Color.rgba(color, 30)}`} onClick={this.trigger} href="#">{this.props.translate(this.state.showContent ? "show_less" : "show_more")}</a></p>
          </div>
        </div>
        {this.state.showContent &&
          <div class={style.details}>
            <div class={style.content} style={`background: ${Color.rgba(color, 30)}`}>
              <div class={style.extendedDesc}>
                <h4>{this.props.translate("extended_description")}</h4>
                <p class={style.description}>{this.description("description")}</p>
              </div>
              <div class={style.detail}>
                <h5 class={style.benefits}>{this.props.translate("potential_benefits")}</h5>
                <ul>
                  {benefits.map((benefit)=>{
                    return <li>{benefit}</li>;
                  })}
                </ul>
              </div>
              <div class={style.detail}>
                <h5 class={style.pitfalls}>{this.props.translate("potential_pitfalls")}</h5>
                <ul>
                  {pitfalls.map((pitfall)=>{
                    return <li>{pitfall}</li>;
                  })}
                </ul>
              </div>
            </div>
          </div>
        }
      </li>
    );
  }
}
