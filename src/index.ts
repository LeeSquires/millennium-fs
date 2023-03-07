import { Loader } from '@googlemaps/js-api-loader';

const loader = new Loader({
  apiKey: 'AIzaSyBSgmItIIkt7rADqH3GMEwVkAledYFipzw',
  version: 'weekly',
  libraries: ['places', 'geometry'],
});

loader.load().then(() => {
  const map = new google.maps.Map(document.getElementById('map-target') as HTMLElement, {
    center: { lat: 51.6842869, lng: -4.1673871 },
    zoom: 8,
  });

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer();

  directionsRenderer.setMap(map);

  const form = document.getElementById('get-quote-form') as HTMLFormElement;

  // set pickup and delivery fields
  const pickup = document.getElementById('direct-from') as HTMLInputElement;
  const delivery = document.getElementById('direct-to') as HTMLInputElement;

  const options = {
    fields: ['geometry', 'place_id'],
    types: ['geocode'],
    componentRestrictions: { country: 'gb' },
  };

  // add autocomplete to the pick-up and deliver to fields
  const pickupAutocomplete = new google.maps.places.Autocomplete(pickup, options);
  const deliveryAutocomplete = new google.maps.places.Autocomplete(delivery, options);

  // Check when form is submitted
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Add autocomplete to form inputs
    const pickupPlace = pickupAutocomplete.getPlace();
    const deliveryPlace = deliveryAutocomplete.getPlace();

    // Stop user from submitting request without autocomplete
    if (!pickupPlace) {
      window.alert('Please select a pick-up location from the dropdown list.');
    } else if (!deliveryPlace) {
      window.alert('Please select a delivery location from the dropdown list.');
      return;
    }

    // Get distance using form input autocompletes
    const service = new google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [pickupPlace.geometry?.location],
        destinations: [deliveryPlace.geometry?.location],
        travelMode: 'DRIVING',
        unitSystem: google.maps.UnitSystem.IMPERIAL,
      },
      callback
    );

    function callback(response, status) {
      if (status === 'OK') {
        const origins = response.originAddresses;
        const destinations = response.destinationAddresses;

        for (let i = 0; i < origins.length; i++) {
          const results = response.rows[i].elements;
          for (let j = 0; j < results.length; j++) {
            const element = results[j];
            const distance = element.distance.text;

            const result = document.getElementById('distance') as HTMLElement;
            result.innerHTML = 'Distance: ' + distance;

            console.log(prices[1]);
          }
        }
      }
    }

    directionsService.route(
      {
        origin: { placeId: pickupPlace.place_id },
        destination: { placeId: deliveryPlace.place_id },
        travelMode: 'DRIVING',
      },
      (response, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(response);
        } else {
          window.alert('Directions request failed due to ' + status);
        }
      }
    );
  });
});
