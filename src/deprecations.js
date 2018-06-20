export default function(traitify){
  traitify.originalAjax = traitify.ajax;
  traitify.ajax = function(method, path, callback, params){
    return this.originalAjax(method, path, params).then(callback);
  };
  traitify.request = function(method, path, params){
    let url = path;
    url += (url.indexOf("?") === -1) ? "?" : "&";
    if(this.ui.options.imagePack) url += `image_pack=${this.ui.options.imagePack}`;

    return this.ajax(method, url, null, params);
  };
  traitify.get = function(path, params, callback){
    if(typeof params == "function"){
      callback = params;
      params = null;
    }

    return this.ajax("GET", path, callback, params);
  };
  traitify.put = function(path, params){ return this.request(this.oldIE ? "POST" : "PUT", path, params); };
  traitify.post = function(path, params){ return this.request("POST", path, params); };
  traitify.setImagePack = function(pack){
    this.ui.setImagePack(pack);
    return this;
  };
  traitify.ui.originalComponent = traitify.ui.component;
  traitify.ui.component = function(options){
    const component = this.originalComponent(options);
    component.allowFullScreen = function(value){ return value ? this.allowFullscreen() : this.disableFullscreen(); };
    component.assessmentId = function(assessmentID){ return this.assessmentID(assessmentID); };
    return component;
  };
  traitify.ui.allowBack = function(value){ return this.component()[value ? "allowBack" : "disableBack"](); };
  traitify.ui.allowFullScreen = function(value){ return this.component()[value ? "allowFullscreen" : "disableFullscreen"](); };
  traitify.ui.assessmentId = function(assessmentID){ return this.component().assessmentID(assessmentID); };
  traitify.ui.on = function(key, callback){ return this.component().on(key, callback); };
  traitify.ui.render = function(options){ return this.component(options).render(); };
  [
    "locale",
    "perspective",
    "target",
    "targets"
  ].forEach((option)=>{
    traitify.ui[option] = (value)=>traitify.ui.component()[option](value);
  });
}
