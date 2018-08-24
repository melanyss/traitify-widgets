import {Component} from "preact";
import withTraitify from "lib/with-traitify";
import {rgba} from "lib/helpers/color";
import style from "./style";

class PersonalityTrait extends Component{
  componentDidMount(){
    this.props.traitify.ui.trigger("PersonalityTrait.initialized", this);
  }
  componentDidUpdate(){
    this.props.traitify.ui.trigger("PersonalityTrait.updated", this);
  }
  render(){
    const trait = this.props.trait.personality_trait;
    const score = Math.round(this.props.trait.score/2 + 50);
    const type = trait.personality_type;
    const color = `#${type.badge.color_1}`;

    return (
      <div class={style.trait} style={`background: ${rgba(color, 8.5)};`}>
        <div class={style.bar} style={`width: ${score}%; background: ${color};`} />
        <div class={style.content}>
          <div class={style.score}>{score}%</div>
          <img src={type.badge.image_medium} alt={type.name} class={style.icon} />
          <h3 class={style.name}>
            {trait.name}
            <span class={style.description}>{trait.definition}</span>
          </h3>
        </div>
      </div>
    );
  }
}

export {PersonalityTrait as Component};
export default withTraitify(PersonalityTrait);
