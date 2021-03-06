import PropTypes from "prop-types";
import {rgba} from "lib/helpers/color";
import {useDidMount, useDidUpdate} from "lib/helpers/hooks";
import TraitifyPropTypes from "lib/helpers/prop-types";
import withTraitify from "lib/with-traitify";
import style from "./style.scss";

function PersonalityTraitDetails(props) {
  const {trait: {personality_trait: trait}, ui} = props;
  const state = {};

  useDidMount(() => { ui.trigger("PersonalityTrait.initialized", {props, state}); });
  useDidUpdate(() => { ui.trigger("PersonalityTrait.updated", {props, state}); });

  const type = trait.personality_type;
  const color = `#${type.badge.color_1}`;

  return (
    <div className={style.trait} style={{background: rgba(color, 8.5)}}>
      <div className={style.bar} style={{width: "100%", background: color}} />
      <div className={style.content}>
        <img src={type.badge.image_medium} alt={type.name} className={style.icon} />
        <h3 className={style.name}>
          {trait.name}
          <span className={style.description}>{trait.definition}</span>
        </h3>
      </div>
    </div>
  );
}

PersonalityTraitDetails.propTypes = {
  trait: PropTypes.shape({
    personality_trait: PropTypes.object.isRequired
  }).isRequired,
  ui: TraitifyPropTypes.ui.isRequired
};

export {PersonalityTraitDetails as Component};
export default withTraitify(PersonalityTraitDetails);
