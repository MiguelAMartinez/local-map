/* This interactive neighborhood map that uses JS Knockout, Google maps API, and a third party API 
to show my favorite restaurants in Austin
References used: Stack Overflow, Mozilla Developer Network, and W3Schools */

/*Apply strict mode to document*/
'use strict';

/*Model section: the data*/
var modelPlaces = [
	{
		name: 'Franklin Barbecue',
		website: 'https://franklinbarbecue.com',
		address: '900 E 11th St, Austin, TX',
		meals: ['x','Lunch','x']		
	}, {
		name: 'La Barbecue',
		website: 'http://labarbecue.com/',
		address: '1906 E Cesar Chavez St, Austin, TX',
		meals: ['x','Lunch','Dinner']	
	}, {
		name: 'Hopdoddy Burger Bar',
		website: 'https://www.hopdoddy.com/',
		address: '1400 S Congress Ave, Austin, TX',
		meals: ['x','Lunch','Dinner']	
	}, {
		name: 'Torchys Tacos',
		website: 'http://torchystacos.com/',
		address: '2801 Guadalupe St, Austin, TX',
		meals: ['Breakfast','Lunch','Dinner']	
	}, {
		name: 'Uchi',
		website: 'http://uchiaustin.com/',
		address: '801 South Lamar Boulevard, Austin, TX',
		meals: ['x','x','Dinner']
	}, {
		name: 'Moonshine Grill',
		website: 'http://moonshinegrill.com/',
		address: '303 Red River St, Austin, TX',
		meals: ['x','Lunch','Dinner']
	}, {
		name: 'Tacodeli',
		website: 'http://tacodeli.com/',
		address: '4200 N Lamar Blvd, Austin, TX',
		meals: ['Breakfast','Lunch','x']
	}, {
		name: 'Kerbey Lane Cafe',
		website: 'http://kerbeylanecafe.com/',
		address: '2606 Guadalupe St, Austin, TX',
		meals: ['Breakfast','Lunch','Dinner']
	}, {
		name: 'Eastside Cafe',
		website: 'http://eastsidecafeaustin.com',
		address: '2113 Manor Rd, Austin, TX',
		meals: ['x','Lunch','Dinner']
	}, {
		name: 'Gus Fried Chicken',
		website: 'https://gusfriedchicken.com/',
		address: '117 San Jacinto Blvd, Austin, TX ',
		meals: ['x','Lunch','Dinner']	
	}
];

var modelMeals = [
	{
		mealType: 'Breakfast', 
		filterCheck: '[X]'
	}, {
		mealType: 'Lunch', 
		filterCheck: '[X]'
	}, {
		mealType: 'Dinner',
		filterCheck: '[X]'
	}		
];

/*Define important variables*/
var selectedMeals = ['Breakfast','Lunch','Dinner'],
	i,
	n,
	m,
	aplaceName,
    currentIW,
    newIWContent,
    defaultIcon,
    overIcon,
    map,
    myViewModel,
    flickrURL = "https://api.flickr.com/services/feeds/photos_public.gne?api_key=6eef62d5866a7d26241929bb8fd3fd46&jsoncallback=?";

/*Make the first iteration of the Google map*/
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 30.274063, lng: -97.763855},
		zoom: 13
	});

	defaultIcon = makeMarkerIcon('fe7569');
	overIcon = makeMarkerIcon('0091ff');

	var geocoder = new google.maps.Geocoder();
	var largeInfowindow = new google.maps.InfoWindow();
	var bounds = new google.maps.LatLngBounds();

	/*Create markers*/
	modelPlaces.forEach(function(place){
		geocoder.geocode(
			{address: place.address},
			function(results, status) {
		    	if (status == google.maps.GeocoderStatus.OK) {
			        place.marker = new google.maps.Marker({
			            map: map,
			            title: place.name,
			            position: results[0].geometry.location
			        });

			        /*When you click on a marker, it changes color, and the
			        map zooms and centers on it*/
	    			place.marker.addListener('click', function() {
	        			newInfoWindow(place, largeInfowindow);
	        			this.setIcon(overIcon);
	        			map.setZoom(14);
			        	map.setCenter(this.getPosition());
	    			});

	    			bounds.extend(place.marker.position);
	    			map.fitBounds(bounds);
		    	} else {
		        	alert("Geocode was not successful for the following reason: " + status);
		      	}
	        }
	    );   
	});
	/*Make global variable of ViewModel()*/
	myViewModel = new ViewModel();
	ko.applyBindings(myViewModel);	
}

/*The meal filter and restaurant places constructors*/ 
function constrPlace(place) {
	this.placeName = ko.observable(place.name);
	this.placeWebsite = ko.observable(place.website);
	this.placeAddress = ko.observable(place.address);
	this.placeMeals = ko.observableArray(place.meals);
}

function constrMeal(data) {
	this.mealName = ko.observable(data.mealType);
	this.filterText = ko.observable(data.filterCheck);
}

/*Connect the user view with the data models*/
function ViewModel() {
	var self = this;

	this.mealList = ko.observableArray([]);

	modelMeals.forEach(function(meal){
		self.mealList.push( new constrMeal(meal) );
	});

	this.placeList = ko.observableArray([]);

	modelPlaces.forEach(function(place){
		self.placeList.push( new constrPlace(place) );
	});

	this.mealFilter = function(meal) {
		if (meal.filterText() === '[X]') {
			i = selectedMeals.indexOf(meal.mealName());
			selectedMeals[i] = 'no' + meal.mealName();
			meal.filterText('[ ]');		
		} else {
			meal.filterText('[X]');
			i = selectedMeals.indexOf('no' + meal.mealName());
			selectedMeals[i] = meal.mealName();
		}
		updateViewList(self);
	};	

	this.listClick = function(aplace) {
		aplaceName = aplace.placeName();
		for (i = 0; i < modelPlaces.length; i++) {
			if (modelPlaces[i].name === aplaceName) {
				google.maps.event.trigger(modelPlaces[i].marker, 'click');
			}
		}
	};
	/*Display error message in case map fails*/
	this.displayMapError = ko.observable(false);
	this.imgError = ko.observable('Could not display imagessss');
	this.displayImgError = ko.observable(false);
}

function googleError() {
	viewModel.displayMapError(true);
}

/*Change color of markers*/
function makeMarkerIcon(markerColor) {
	var markerImage = new google.maps.MarkerImage(
	  'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
	  '|40|_|%E2%80%A2',
	  new google.maps.Size(21, 34),
	  new google.maps.Point(0, 0),
	  new google.maps.Point(10, 34),
	  new google.maps.Size(21,34));
	return markerImage;
}

/*Create new infowindow and clear previous ones
Use Flickr API to get images about each food place*/
function newInfoWindow(place, infowindow) {
	modelPlaces.forEach(function(place){
		place.marker.setIcon(defaultIcon);
	});

	if (currentIW) {
    	currentIW.close();		
	}

	/*API Request*/
	$.getJSON( flickrURL, {
			tags: place.name,
			tagmode: "any",
			format: "json"
	}).done(function( data ) {
		$.each( data.items, function( i, item ) {
			$( "<img>" ).attr( "src", item.media.m ).appendTo( ".images" );
			if ( i === 12 ) {
			  return false;
			}
		});
	}).fail(function () {
		/*Message in case API request fails*/

    	// $(".images").text("Failed to get Flickr Images");

    	// TODO: Add error message using Knockout instead of jQuery
    	myViewModel.displayImgError(true);
	});

	if (infowindow.marker != place.marker) {
		infowindow.marker = place.marker;
		// TODO: Add error message using Knockout instead of jQuery
		newIWContent = '<h2 class="title-infoW">' + place.marker.title + '</h2><p class="sub-infoW">' + place.address + '</p><br><p class="sub-infoW">Images from Flickr:</p><div class="images"><div data-bind="text: imgError, visible: displayImgError"></div></div>';
		// newIWContent = '<h2 class="title-infoW">' + place.marker.title + '</h2><p class="sub-infoW">' + place.address + '</p><br><p class="sub-infoW">Images from Flickr:</p><div class="images"></div>';
		infowindow.setContent(newIWContent);
		currentIW = infowindow;
		infowindow.open(map, place.marker);
		infowindow.addListener('closeclick',function(){
			infowindow.marker = null;
			place.marker.setIcon(defaultIcon);
		});
	}
}

/*Update map after meal filter*/
function updateViewList(self) {
	self.placeList.removeAll(); 
	modelPlaces.forEach(function(place){
		if (place.meals[0] === selectedMeals[0]) {
			place.marker.setMap(map);
			self.placeList.push( new constrPlace(place) );
		} else if (place.meals[1] === selectedMeals[1]) {
			place.marker.setMap(map);
			self.placeList.push( new constrPlace(place) );
		} else if (place.meals[2] === selectedMeals[2]) {
			place.marker.setMap(map);
			self.placeList.push( new constrPlace(place) );
		} else {
			place.marker.setMap(null);
		}
	});

	// TODO: find more sophisticated iteration, something that kind of looks like this
	// for (i = 0; i < modelPlaces.length; i++) {
	// 	var mealsLength = modelPlaces[i].meals.length;
	// 	for (n = 0; n < mealsLength; n++) {
	// 		for (m = 0; n < selectedMeals.length; m++) {
	// 			if (modelPlaces[i].meals[n] === selectedMeals[m]) {
	// 				if (typeof self.placeList[i] === 'undefined') {
	// 					modelPlaces[i].marker.setMap(map);
	// 					self.placeList.push( new constrPlace(modelPlaces[i]) );	
	// 				} 
	// 			} else {
	// 				modelPlaces[i].marker.setMap(null);
	// 				self.placeList.removeAll([placeList[i]]);
	// 			}
	// 		}
	// 	}
	// }
}
