"use strict";
(() => {
  // bin/live-reload.js
  new EventSource(`http://localhost:${3e3}/esbuild`).addEventListener(
    "change",
    () => location.reload()
  );

  // node_modules/.pnpm/@googlemaps+js-api-loader@1.15.1/node_modules/@googlemaps/js-api-loader/dist/index.esm.js
  var fastDeepEqual = function equal(a, b) {
    if (a === b)
      return true;
    if (a && b && typeof a == "object" && typeof b == "object") {
      if (a.constructor !== b.constructor)
        return false;
      var length, i, keys;
      if (Array.isArray(a)) {
        length = a.length;
        if (length != b.length)
          return false;
        for (i = length; i-- !== 0; )
          if (!equal(a[i], b[i]))
            return false;
        return true;
      }
      if (a.constructor === RegExp)
        return a.source === b.source && a.flags === b.flags;
      if (a.valueOf !== Object.prototype.valueOf)
        return a.valueOf() === b.valueOf();
      if (a.toString !== Object.prototype.toString)
        return a.toString() === b.toString();
      keys = Object.keys(a);
      length = keys.length;
      if (length !== Object.keys(b).length)
        return false;
      for (i = length; i-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(b, keys[i]))
          return false;
      for (i = length; i-- !== 0; ) {
        var key = keys[i];
        if (!equal(a[key], b[key]))
          return false;
      }
      return true;
    }
    return a !== a && b !== b;
  };
  var DEFAULT_ID = "__googleMapsScriptId";
  var LoaderStatus;
  (function(LoaderStatus2) {
    LoaderStatus2[LoaderStatus2["INITIALIZED"] = 0] = "INITIALIZED";
    LoaderStatus2[LoaderStatus2["LOADING"] = 1] = "LOADING";
    LoaderStatus2[LoaderStatus2["SUCCESS"] = 2] = "SUCCESS";
    LoaderStatus2[LoaderStatus2["FAILURE"] = 3] = "FAILURE";
  })(LoaderStatus || (LoaderStatus = {}));
  var Loader = class {
    /**
     * Creates an instance of Loader using [[LoaderOptions]]. No defaults are set
     * using this library, instead the defaults are set by the Google Maps
     * JavaScript API server.
     *
     * ```
     * const loader = Loader({apiKey, version: 'weekly', libraries: ['places']});
     * ```
     */
    constructor({ apiKey, authReferrerPolicy, channel, client, id = DEFAULT_ID, language, libraries = [], mapIds, nonce, region, retries = 3, url = "https://maps.googleapis.com/maps/api/js", version }) {
      this.CALLBACK = "__googleMapsCallback";
      this.callbacks = [];
      this.done = false;
      this.loading = false;
      this.errors = [];
      this.apiKey = apiKey;
      this.authReferrerPolicy = authReferrerPolicy;
      this.channel = channel;
      this.client = client;
      this.id = id || DEFAULT_ID;
      this.language = language;
      this.libraries = libraries;
      this.mapIds = mapIds;
      this.nonce = nonce;
      this.region = region;
      this.retries = retries;
      this.url = url;
      this.version = version;
      if (Loader.instance) {
        if (!fastDeepEqual(this.options, Loader.instance.options)) {
          throw new Error(`Loader must not be called again with different options. ${JSON.stringify(this.options)} !== ${JSON.stringify(Loader.instance.options)}`);
        }
        return Loader.instance;
      }
      Loader.instance = this;
    }
    get options() {
      return {
        version: this.version,
        apiKey: this.apiKey,
        channel: this.channel,
        client: this.client,
        id: this.id,
        libraries: this.libraries,
        language: this.language,
        region: this.region,
        mapIds: this.mapIds,
        nonce: this.nonce,
        url: this.url,
        authReferrerPolicy: this.authReferrerPolicy
      };
    }
    get status() {
      if (this.errors.length) {
        return LoaderStatus.FAILURE;
      }
      if (this.done) {
        return LoaderStatus.SUCCESS;
      }
      if (this.loading) {
        return LoaderStatus.LOADING;
      }
      return LoaderStatus.INITIALIZED;
    }
    get failed() {
      return this.done && !this.loading && this.errors.length >= this.retries + 1;
    }
    /**
     * CreateUrl returns the Google Maps JavaScript API script url given the [[LoaderOptions]].
     *
     * @ignore
     */
    createUrl() {
      let url = this.url;
      url += `?callback=${this.CALLBACK}`;
      if (this.apiKey) {
        url += `&key=${this.apiKey}`;
      }
      if (this.channel) {
        url += `&channel=${this.channel}`;
      }
      if (this.client) {
        url += `&client=${this.client}`;
      }
      if (this.libraries.length > 0) {
        url += `&libraries=${this.libraries.join(",")}`;
      }
      if (this.language) {
        url += `&language=${this.language}`;
      }
      if (this.region) {
        url += `&region=${this.region}`;
      }
      if (this.version) {
        url += `&v=${this.version}`;
      }
      if (this.mapIds) {
        url += `&map_ids=${this.mapIds.join(",")}`;
      }
      if (this.authReferrerPolicy) {
        url += `&auth_referrer_policy=${this.authReferrerPolicy}`;
      }
      return url;
    }
    deleteScript() {
      const script = document.getElementById(this.id);
      if (script) {
        script.remove();
      }
    }
    /**
     * Load the Google Maps JavaScript API script and return a Promise.
     */
    load() {
      return this.loadPromise();
    }
    /**
     * Load the Google Maps JavaScript API script and return a Promise.
     *
     * @ignore
     */
    loadPromise() {
      return new Promise((resolve, reject) => {
        this.loadCallback((err) => {
          if (!err) {
            resolve(window.google);
          } else {
            reject(err.error);
          }
        });
      });
    }
    /**
     * Load the Google Maps JavaScript API script with a callback.
     */
    loadCallback(fn) {
      this.callbacks.push(fn);
      this.execute();
    }
    /**
     * Set the script on document.
     */
    setScript() {
      if (document.getElementById(this.id)) {
        this.callback();
        return;
      }
      const url = this.createUrl();
      const script = document.createElement("script");
      script.id = this.id;
      script.type = "text/javascript";
      script.src = url;
      script.onerror = this.loadErrorCallback.bind(this);
      script.defer = true;
      script.async = true;
      if (this.nonce) {
        script.nonce = this.nonce;
      }
      document.head.appendChild(script);
    }
    /**
     * Reset the loader state.
     */
    reset() {
      this.deleteScript();
      this.done = false;
      this.loading = false;
      this.errors = [];
      this.onerrorEvent = null;
    }
    resetIfRetryingFailed() {
      if (this.failed) {
        this.reset();
      }
    }
    loadErrorCallback(e) {
      this.errors.push(e);
      if (this.errors.length <= this.retries) {
        const delay = this.errors.length * Math.pow(2, this.errors.length);
        console.log(`Failed to load Google Maps script, retrying in ${delay} ms.`);
        setTimeout(() => {
          this.deleteScript();
          this.setScript();
        }, delay);
      } else {
        this.onerrorEvent = e;
        this.callback();
      }
    }
    setCallback() {
      window.__googleMapsCallback = this.callback.bind(this);
    }
    callback() {
      this.done = true;
      this.loading = false;
      this.callbacks.forEach((cb) => {
        cb(this.onerrorEvent);
      });
      this.callbacks = [];
    }
    execute() {
      this.resetIfRetryingFailed();
      if (this.done) {
        this.callback();
      } else {
        if (window.google && window.google.maps && window.google.maps.version) {
          console.warn("Google Maps already loaded outside @googlemaps/js-api-loader.This may result in undesirable behavior as options and script parameters may not match.");
          this.callback();
          return;
        }
        if (this.loading)
          ;
        else {
          this.loading = true;
          this.setCallback();
          this.setScript();
        }
      }
    }
  };

  // src/utils/prices.json
  var prices_default = [
    { VanType: "Small", PriceValue: 1.35 },
    { VanType: "Large", PriceValue: 1.45 },
    { VanType: "Extra Large", PriceValue: 1.65 }
  ];

  // src/index.ts
  var loader = new Loader({
    apiKey: "AIzaSyBSgmItIIkt7rADqH3GMEwVkAledYFipzw",
    version: "weekly",
    libraries: ["places", "geometry"]
  });
  loader.load().then(() => {
    const map = new google.maps.Map(document.getElementById("map-target"), {
      center: { lat: 51.6842869, lng: -4.1673871 },
      zoom: 8
    });
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);
    const pickup = document.getElementById("direct-from");
    const delivery = document.getElementById("direct-to");
    const options = {
      fields: ["geometry", "place_id"],
      types: ["geocode"],
      componentRestrictions: { country: "gb" }
    };
    const pickupAutocomplete = new google.maps.places.Autocomplete(pickup, options);
    const deliveryAutocomplete = new google.maps.places.Autocomplete(delivery, options);
    const form = document.getElementById("get-quote-form");
    const vanSmall = document.getElementById("van-small");
    const vanLarge = document.getElementById("van-large");
    const vanExtraLarge = document.getElementById("van-extra-large");
    let vanSmallActive = false;
    let vanLargeActive = false;
    let vanExtraLargeActive = false;
    vanSmall.addEventListener("click", (e) => {
      if (!vanSmallActive) {
        vanSmallActive = true;
        vanLargeActive = false;
        vanExtraLargeActive = false;
        console.log("small van active");
      }
    });
    vanLarge.addEventListener("click", (e) => {
      if (!vanLargeActive) {
        vanLargeActive = true;
        vanSmallActive = false;
        vanExtraLargeActive = false;
        console.log("medium van active");
      }
    });
    vanExtraLarge.addEventListener("click", (e) => {
      if (!vanExtraLargeActive) {
        vanExtraLargeActive = true;
        vanSmallActive = false;
        vanLargeActive = false;
        console.log("large van active");
      }
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const pickupPlace = pickupAutocomplete.getPlace();
      const deliveryPlace = deliveryAutocomplete.getPlace();
      if (!pickupPlace) {
        window.alert("Please select a pick-up location from the dropdown list.");
      } else if (!deliveryPlace) {
        window.alert("Please select a delivery location from the dropdown list.");
        return;
      }
      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins: [pickupPlace.geometry?.location],
          destinations: [deliveryPlace.geometry?.location],
          travelMode: "DRIVING",
          unitSystem: google.maps.UnitSystem.IMPERIAL
        },
        callback
      );
      function callback(response, status) {
        if (status === "OK") {
          const origins = response.originAddresses;
          for (let i = 0; i < origins.length; i++) {
            const results = response.rows[i].elements;
            for (let j = 0; j < results.length; j++) {
              const element = results[j];
              const distance = parseFloat(element.distance.text);
              let quoteResult;
              const currencyFormat = {
                style: "currency",
                currency: "GBP"
              };
              if (vanSmallActive) {
                quoteResult = prices_default[0].PriceValue * distance;
              } else if (vanLargeActive) {
                quoteResult = prices_default[1].PriceValue * distance;
              } else if (vanExtraLargeActive) {
                quoteResult = prices_default[2].PriceValue * distance;
              }
              const formatQuote = quoteResult.toLocaleString("en-GB", currencyFormat);
              const result = document.getElementById("quote-result");
              result.innerHTML = formatQuote;
              const quoteContainer = document.getElementById("quote-container");
              quoteContainer.classList.remove("hide");
            }
          }
        }
      }
      directionsService.route(
        {
          origin: { placeId: pickupPlace.place_id },
          destination: { placeId: deliveryPlace.place_id },
          travelMode: "DRIVING"
        },
        (response, status) => {
          if (status === "OK") {
            directionsRenderer.setDirections(response);
          } else {
            window.alert("Directions request failed due to " + status);
          }
        }
      );
    });
  });
})();
//# sourceMappingURL=index.js.map
