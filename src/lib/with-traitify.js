import Airbrake from "airbrake-js";
import {Component} from "preact";
import {getDisplayName, loadFont} from "lib/helpers";

// Unwrap Airbrake's console wrapper
["debug", "log", "info", "warn", "error"].forEach((method)=>{
  if(method in console && console[method].inner){
    console[method] = console[method].inner;
  }
});

export default function withTraitify(WrappedComponent){
  return class TraitifyComponent extends Component{
    static displayName = `Traitify${getDisplayName(WrappedComponent)}`
    constructor(props){
      super(props);

      this.state = {};
      this.setupTraitify();
      this.setupAirbrake();
      this.setupCache();
      this.setupI18n();
      this.setAssessmentID();
    }
    componentDidMount(){
      loadFont();

      this.updateAssessment();
    }
    componentDidUpdate(prevProps, prevState){
      const newAssessment = this.props.assessment || {};
      const oldAssessment = prevProps.assessment || {};

      if(oldAssessment.id !== newAssessment.id){
        this.setState({assessmentID: newAssessment.id});
      }else if(prevProps.assessmentID !== this.props.assessmentID){
        this.setState({assessmentID: this.props.assessmentID});
      }

      const changes = {
        assessmentID: prevState.assessmentID !== this.state.assessmentID,
        deckID: prevState.deckID !== this.state.deckID,
        locale: prevState.locale !== this.state.locale
      };

      if(changes.assessmentID || changes.locale){
        this.updateAssessment({oldID: prevState.assessmentID, oldLocale: prevState.locale});
      }

      if(this.state.followingDeck && (changes.deckID || changes.locale)){
        this.updateDeck({oldID: prevState.deckID, oldLocale: prevState.locale});
      }
    }
    componentWillUnmount(){
      Object.keys(this.listeners).forEach((key)=>{ this.removeListener(key); });
    }
    componentDidCatch(error, info){
      this.airbrake && this.airbrake.notify({
        error,
        params: {
          info,
          session: {
            host: this.traitify.host,
            publicKey: this.traitify.publicKey
          }
        }
      });

      this.setState({error});
    }
    addListener = (key, callback)=>{
      this.listeners = this.listeners || {};
      this.listeners[key] = callback;
      this.traitify.ui.on(key, callback);
    }
    followDeck = ()=>{
      this.setState({followingDeck: true});
      this.updateDeck();
    }
    getAssessment = (options = {})=>{
      const {assessmentID, locale} = this.state;
      if(!assessmentID){ return Promise.resolve(); }

      const key = `${locale}.assessment.${assessmentID}`;
      const hasResults = (data)=>(
        data && data.locale_key
          && data.id === assessmentID
          && data.locale_key.toLowerCase() === locale
          && data.personality_types
          && data.personality_types.length > 0
      );
      const setAssessment = (data)=>(
        new Promise((resolve)=>{
          this.setState({assessment: data}, ()=>(resolve(data)));
          this.traitify.ui.trigger(key, this, data);
        })
      );

      let assessment = this.props.assessment;
      if(hasResults(assessment)){ return setAssessment(assessment); }

      assessment = this.cache.get(key);
      if(hasResults(assessment)){ return setAssessment(assessment); }

      if(this.traitify.ui.requests[key] && !options.force){ return this.traitify.ui.requests[key]; }

      return this.traitify.ui.requests[key] = this.traitify.get(`/assessments/${assessmentID}`, {
        data: "archetype,blend,instructions,slides,types,traits",
        locale_key: locale
      }).then((data)=>{
        if(hasResults(data)){ this.cache.set(key, data); }

        setAssessment(data);
      }).catch((error)=>{
        console.warn(error);

        delete this.traitify.ui.requests[key];
      });
    }
    getDeck = (options = {})=>{
      const {deckID, locale} = this.state;
      if(!deckID){ return Promise.resolve(); }

      const key = `${locale}.deck.${deckID}`;
      const hasData = (data)=>(
        data && data.locale_key
          && data.id === deckID
          && data.locale_key.toLowerCase() === locale
          && data.name
      );
      const setDeck = (data)=>(
        new Promise((resolve)=>{
          this.setState({deck: data}, ()=>(resolve(data)));
          this.traitify.ui.trigger(key, this, data);
        })
      );

      let deck = this.state.deck;
      if(hasData(deck)){ return setDeck(deck); }

      deck = this.cache.get(key);
      if(hasData(deck)){ return setDeck(deck); }

      if(this.traitify.ui.requests[key] && !options.force){ return this.traitify.ui.requests[key]; }

      return this.traitify.ui.requests[key] = this.traitify.get(`/decks/${deckID}`, {
        locale_key: locale
      }).then((data)=>{
        if(data && !data.locale_key){ data.locale_key = locale; }
        if(hasData(data)){ this.cache.set(key, data); }

        setDeck(data);
      }).catch((error)=>{
        console.warn(error);

        delete this.traitify.ui.requests[key];
      });
    }
    getListener = (key)=>(this.listeners[key])
    getOption = (name)=>{
      if(this.props[name] != null){ return this.props[name]; }
      if(this.props.options && this.props.options[name] != null){ return this.props.options[name]; }
      if(this.traitify && this.traitify.ui.options[name] != null){ return this.traitify.ui.options[name]; }
    }
    isReady = (type)=>{
      const {assessment, deck} = this.state;

      switch(type){
        case "deck":
          return !!((deck && !!deck.name));
        case "results":
          return !!(assessment && (assessment.personality_types || []).length > 0);
        case "slides":
          return !!(assessment && (assessment.slides || []).length > 0);
        default:
          return false;
      }
    }
    removeListener = (key)=>{
      this.traitify.ui.off(key, this.getListener(key));
      delete this.listeners[key];
    }
    setAssessmentID(){
      this.setState({
        assessmentID: this.getOption("assessmentID") || (
          this.props.assessment && this.props.assessment.id
        )
      });
    }
    setupAirbrake(){
      if(this.getOption("disableAirbrake")){ return; }

      this.airbrake = this.props.airbrake;
      if(this.airbrake){ return; }

      this.airbrake = new Airbrake({
        ignoreWindowError: true,
        projectId: "141848",
        projectKey: "c48de83d0f02ea6d598b491878c0c57e"
      });
      this.airbrake.addFilter((notice)=>{
        const host = window.location.host;

        if(host.includes("lvh.me:3000")){
          notice.context.environment = "development";
        }else if(host.includes("stag.traitify.com")){
          notice.context.environment = "staging";
        }else if(host.includes("traitify.com")){
          notice.context.environment = "production";
        }else{
          notice.context.environment = "client";
        }

        notice.context.version = this.traitify.__version__;

        return notice;
      });
    }
    setupCache(){
      this.cache = this.props.cache || {
        get(key){
          try{
            const data = sessionStorage.getItem(key);

            if(data){ return JSON.parse(data); }
          }catch(error){ return; }
        },
        set(key, data){
          try{
            return sessionStorage.setItem(key, JSON.stringify(data));
          }catch(error){ return; }
        }
      };
    }
    setupI18n(){
      this.addListener("I18n.setLocale", (_, locale)=>{ this.setState({locale: locale.toLowerCase()}); });

      const locale = this.props.locale || (this.props.options && this.props.options.locale);
      if(locale && locale.toLowerCase() !== this.traitify.ui.i18n.locale){
        this.traitify.ui.setLocale(locale.toLowerCase());
      }else{
        this.setState({locale: this.traitify.ui.i18n.locale});
      }
    }
    setupTraitify(){
      this.traitify = this.props.traitify || window.Traitify;

      if(!this.traitify){ throw new Error("Traitify must be passed as a prop or attached to window"); }
    }
    updateAssessment(options = {}){
      if(options.oldID || options.oldLocale){
        const oldAssessmentID = options.oldID || this.state.assessmentID;
        const oldLocale = options.oldLocale || this.state.locale;
        const key = `${oldLocale}.assessment.${oldAssessmentID}`;

        this.removeListener(key);
      }
      if(this.state.assessmentID){
        const key = `${this.state.locale}.assessment.${this.state.assessmentID}`;

        this.addListener(key, (_, assessment)=>{
          this.setState({assessment, assessmentID: assessment.id, deck: null, deckID: assessment.deck_id});
        });

        const currentValue = this.traitify.ui.current[key];
        if(currentValue != null){
          this.getListener(key)(null, currentValue);
        }else{
          this.getAssessment();
        }
      }
    }
    updateDeck(options = {}){
      if(options.oldID || options.oldLocale){
        const oldDeckID = options.oldID || this.state.deckID;
        const oldLocale = options.oldLocale || this.state.locale;
        const key = `${oldLocale}.deck.${oldDeckID}`;

        this.removeListener(key);
      }
      if(this.state.deckID){
        const key = `${this.state.locale}.deck.${this.state.deckID}`;

        this.addListener(key, (_, deck)=>{
          this.setState({deck});
        });

        const currentValue = this.traitify.ui.current[key];
        if(currentValue != null){
          this.getListener(key)(null, currentValue);
        }else{
          this.getDeck();
        }
      }
    }
    render(){
      const {
        airbrake,
        cache,
        followDeck,
        getAssessment,
        getOption,
        isReady,
        props,
        state,
        traitify
      } = this;

      const {locale, translate} = this.traitify.ui.i18n;
      const options = {
        ...props,
        ...state,
        airbrake,
        cache,
        followDeck,
        getAssessment,
        getOption,
        locale,
        isReady,
        traitify,
        translate
      };

      return <WrappedComponent {...options} />;
    }
  };
}