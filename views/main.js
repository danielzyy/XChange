const $ = document.getElementById.bind(document);

const id = 'n/a73945850';
const key = 'as7le53h10hmv3ce392377m8fi';
const base = 'https://xecdapi.xe.com/v1/convert_from.json/';

let map;

const reset = () => {
  localStorage.clear();
  location.reload();
}

const latlon = async () => {
  const response = await (await fetch('https://api.ipify.org?format=json')).json();
  const proxyURL = 'https://cors-anywhere.herokuapp.com/';
  const targetURL = `http://api.ipstack.com/${response['ip']}?access_key=760628d5decbc2753ef07b989107005a`
  const data = await (await fetch(proxyURL + targetURL)).json();
  const { latitude: lat, longitude: lng} = data;
  return { lat, lng };
}

const getAddr = async () => {
  const { lat, lng } = await latlon();
  const res = await reverseGeo(lat, lng);
  $('exchangeAddr').value = res[0].formatted_address;
}

const updateExchange = async () => {
  const addr = $('exchangeAddr').value;
  const from = $('exchangeFrom').value;
  const to = $('exchangeTo').value;
  const rbody = await fetch(`/markers?location=${addr}&from=${from}&to=${to}`);

  const res = await rbody.json();
  console.log(res);
  const contentString = `Exchange rates for ${addr}:<br>${res.rates.map(c => `<strong>${c.from} = ${c.to}</strong>`).join('<br  >')}`;

  const infowindow = new google.maps.InfoWindow({
    content: contentString
  });
  const marker = new google.maps.Marker({
    position: (await geo(addr))[0].geometry.location,
    map,
    title: 'addr'
  });
  marker.addListener('click', () => {
    infowindow.open(map, marker);
  });
}

function initMap() {
  initMapHelper().then(() => console.log('Map initialized'))
  var geocoder = new google.maps.Geocoder();
}

const initMapHelper = async () => {
  // var uluru = { lat: 43.47, lng: -80.53 };
  const loc = await latlon();
  map = new google.maps.Map($('map'), { zoom: 14, center: loc });

  const r = await fetch('/getall');
  const res = await r.json();

  for(const v of Object.values(res)){
    const addr = v.location;
    const contentString = `Exchange rates for ${addr}:<br>${v.rates.map(c => `<strong>${c.from} = ${c.to}</strong>`).join('<br  >')}`;

    const infowindow = new google.maps.InfoWindow({
      content: contentString
    });
    const marker = new google.maps.Marker({
      position: (await geo(addr))[0].geometry.location,
      map,
      title: 'addr'
    });
    marker.addListener('click', () => {
      infowindow.open(map, marker);
    });
  }
}

const reverseGeo = async (lat, lng) => {
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyBeYhpiQO4ue0N2yzsnNf08GVTzY52J48c`)
  const r = await res.json();
  return r.results;
}

const geo = async (addr) => {
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${addr}&key=AIzaSyBeYhpiQO4ue0N2yzsnNf08GVTzY52J48c`)
  const r = await res.json();
  return r.results;
}

const geocodeAddress = () => {
  const geocoder = new google.maps.Geocoder();
  const resultsMap = $('map');
  var address = $('location').value;
  geocoder.geocode({ address }, (results, status) => {
    if (status === 'OK') {
      resultsMap.setCenter(results[0].geometry.location);
      var marker = new google.maps.Marker({
        map: resultsMap,
        position: results[0].geometry.location
      });
    } else {
      console.log('Geocode was not successful for the following reason: ' + status);
    }
  });
}

let budget = +localStorage['budget'];
let iso = localStorage['iso'];
if(!localStorage['transactions']) localStorage['transactions'] = JSON.stringify({t:[]})

const updateBudget = (amount) => {
  budget = (budget || 0) + amount;
  localStorage['budget'] = String(budget);
  $('remainder').innerHTML = `${Math.round(budget * 100) / 100} ${iso}`;
}

const transactions = $('transactions');

const recordTransaction = (transaction) => {
  let td = document.createElement('tr');
  for(const r of transaction){
    let tr = document.createElement('td');
    tr.innerHTML = r;
    td.appendChild(tr);
  }
  let temp = JSON.parse(localStorage['transactions']);
  temp['t'].push(transaction);
  localStorage['transactions'] = JSON.stringify(temp);
  transactions.prepend(td);
  if(transactions.childElementCount >= 10) transactions.removeChild(transactions.lastChild)
}

const payment = () => {
  let [ amt, iso_ ] = $('userInput').value.split(' ');
  convert(iso_, iso, +amt).then(r => {
    updateBudget(-r);
    recordTransaction([`${amt} ${iso_}`, `${r} ${iso}`, `${Math.round(budget*100)/100} ${iso}`, new Date().toLocaleString()]);
  });  
}

window.onload = () => {
  if(isNaN(budget) || typeof iso === 'undefined'){
    // User hasn't submitted a budget yet. Hide other objects until they do
    $('budget').innerHTML = 'Please enter your budget (e.g. 125 CAD)';
    $('remainder').style.display = 'none';
    $('userInput').placeholder = 'XX.XX ISO...'
  } else {
    $('budget').innerHTML = 'Record a payment:';
    $('userInput').placeholder = '20 CNY...';
    $('submit').href = 'javascript:payment()';
    updateBudget(0);
  }
  let previousTransactions = JSON.parse(localStorage['transactions']).t.slice(0, 10);
  for(const t of previousTransactions){
    let td = document.createElement('tr');
    for(const r of t){
      let tr = document.createElement('td');
      tr.innerHTML = r;
      td.appendChild(tr);
    }
    transactions.prepend(td);
  }
}

const submitBudget = () => {
  const val = $('userInput').value.split(' ');
  if(!val.length == 2 || isNaN(+val[0]) || !/^[A-Z]{3}$/.test(val[1] = val[1].toUpperCase())){
    return $('budget').innerHTML = 'Please enter your budget (e.g. 125 CAD)\nInvalid value. Please enter your budget in the format of "[Amount] [ISO]"';
  }
  $('remainder').style.display = '';
  $('budget').innerHTML = 'Record a payment:';
  $('userInput').placeholder = '20 CNY...';
  localStorage['budget'] = val[0];
  localStorage['iso'] = iso = val[1].toUpperCase();  
  updateBudget(+val[0]);
  $('submit').href = 'javascript:payment()';
}

const convert = async (from, to, amount) => {
  const response = await (await fetch(`${base}?from=${from}&to=${to}&amount=${amount}&decimal_places=2`, { headers: { Authorization: `Basic ${btoa(`${id}:${key}`)}` } })).json();
  return response.to[0].mid;
}