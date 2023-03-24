import { Loader } from '@googlemaps/js-api-loader';

import prices from './utils/prices.json';

const loader = new Loader({
  apiKey: 'AIzaSyBSgmItIIkt7rADqH3GMEwVkAledYFipzw',
  version: 'weekly',
  libraries: ['places', 'geometry'],
});

loader.load().then(() => {
  const map = new google.maps.Map(document.getElementById('map-target') as HTMLElement, {
    mapId: '1fc4dbcdc8793781',
    center: { lat: 51.6842869, lng: -4.1673871 },
    zoom: 8,
  });

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer();

  directionsRenderer.setMap(map);

  // Set pickup and delivery fields
  const pickup = document.getElementById('direct-from') as HTMLInputElement;
  const delivery = document.getElementById('direct-to') as HTMLInputElement;

  const options = {
    fields: ['geometry', 'place_id'],
    types: ['geocode'],
    componentRestrictions: { country: 'gb' },
  };

  // Add autocomplete to the pick-up and deliver to fields
  const pickupAutocomplete = new google.maps.places.Autocomplete(pickup, options);
  const deliveryAutocomplete = new google.maps.places.Autocomplete(delivery, options);

  // Copy input from date picker to webflow form input
  const datePicker = document.getElementById('date-picker') as HTMLInputElement;
  const dateInput = document.getElementById('date') as HTMLInputElement;
  let dateSelected;
  datePicker.addEventListener('change', () => {
    const dateFormatted = new Date(datePicker.value).toLocaleDateString('en-GB');
    dateInput.value = dateFormatted;
    dateSelected = dateFormatted;
  });

  type VanSize =
    | 'van-small'
    | 'van-medium'
    | 'van-large'
    | 'van-x-large'
    | 'van-xx-large'
    | 'van-xxx-large';

  const vanSizes: VanSize[] = [
    'van-small',
    'van-medium',
    'van-large',
    'van-x-large',
    'van-xx-large',
    'van-xxx-large',
  ];

  let vanSizeActive: VanSize | null = null;

  function handleClick(vanSize: VanSize) {
    if (vanSizeActive !== vanSize) {
      vanSizeActive = vanSize;
    }
  }

  vanSizes.forEach((vanSize) => {
    const element = document.getElementById(vanSize);
    if (element) {
      element.addEventListener('click', () => handleClick(vanSize));
    }
  });

  const quoteButton = document.getElementById('get-quote-button') as HTMLButtonElement;

  // Check when form is submitted
  quoteButton.addEventListener('click', (e) => {
    // e.preventDefault();
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

    // Stop user from submitting request without date selected
    if (!dateSelected) {
      window.alert('Please enter a date');
      return;
    }

    // Stop user from submitting request without van selected
    if (vanSizeActive === null) {
      window.alert('Please select a van size');
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

        for (let i = 0; i < origins.length; i++) {
          const results = response.rows[i].elements;
          for (let j = 0; j < results.length; j++) {
            const element = results[j];
            const routeDistance = parseFloat(element.distance.text);

            let quoteResult;

            const currencyFormat = {
              style: 'currency',
              currency: 'GBP',
            };

            // determine selected van size and calculate price based on PriceValue * distance
            const sizeIndex = vanSizes.indexOf(vanSizeActive);

            if (sizeIndex !== -1) {
              quoteResult = prices[sizeIndex].PriceValue * routeDistance;
            }

            // apply 10% discount if over 200 miles
            if (routeDistance > 200) {
              quoteResult = quoteResult * 0.9;
            }

            const formatQuote = quoteResult.toLocaleString('en-GB', currencyFormat);

            // write quote results to DOM
            const result = document.getElementById('quote-result') as HTMLElement;
            const valueInput = document.getElementById('quote-value') as HTMLInputElement;
            const vanSizeInput = document.getElementById('van-size') as HTMLInputElement;
            const quoteWrapper = document.getElementById('quote-wrapper') as HTMLElement;
            const quotePickup = document.getElementById('quote-pickup') as HTMLElement;
            const quoteDelivery = document.getElementById('quote-delivery') as HTMLElement;
            const quoteDistance = document.getElementById('quote-distance') as HTMLElement;
            const quoteVehicle = document.getElementById('quote-vehicle') as HTMLElement;
            const quoteDate = document.getElementById('quote-date') as HTMLElement;

            // update quote result
            result.innerHTML = `<b>Estimated Cost:</b> </br>${formatQuote}`;
            valueInput.value = formatQuote;

            // update date
            quoteDate.innerHTML = `<b>Date:</b> </br>${dateSelected}`;

            // update distance
            quoteDistance.innerHTML = `<b>Distance:</b> </br>${routeDistance} miles`;

            // update pickup and delivery locations
            quotePickup.innerHTML = `<b>Pickup Location:</b> </br>${pickup.value}`;
            quoteDelivery.innerHTML = `<b>Delivery Location:</b> </br>${delivery.value}`;

            // update van size
            quoteVehicle.innerHTML = `<b>Vehicle:</b> </br>${prices[sizeIndex].VanType}`;
            vanSizeInput.value = prices[sizeIndex].VanType;

            // show quote wrapper
            quoteWrapper.classList.remove('hide');
            quoteWrapper.scrollIntoView({ behavior: 'smooth' });
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
