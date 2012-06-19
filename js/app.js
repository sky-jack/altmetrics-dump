
Array.prototype.isArray = true;

var dataHolder =  {

	doi : '10.1038/480426a',

	equivalents: {
		"cohorts" : "Cohorts - (experimental)",
		"tq" : "Twitter Quotes",
		"altmetric_id" : 'Altmetrics Id',
		"cited_by_fbwalls_count" : "Facebook wall count",
		"cited_by_feeds_count" : "RSS citation count",
		"altmetric_jid" : "Altmetrics jid",
		"cited_by_gplus_count" : "Google Plus citations",
		"cited_by_tweeters_count" : "Twitter citations",
		"cited_by_posts_count" : "Blog post citatations",
		"cited_by_rdts_count" : "Reddit Citatations",
		"cited_by_qs_count" : "Stack Exchange Citatations",
		"url": "Article URL",
		"score" : "Altmetrics Score",
		"added_on" : "Date added",
		"published_on" : "Publication date",
		"last_updated" : "Last updated",
		"details_url" : "URL details"
	},
	pageError:	function (){
			$(".error-message").fadeIn();
	},
	getId : function () {
		var that = this, altmetricCall;
		altmetricCall = "http://api.altmetric.com/v1/doi/" + this.doi;

		function updatePage(initData) {
			console.log(this);
			if (initData) {
			console.log(initData);
			that.getData(initData.altmetric_id);	
			} else {
				console.log('no response');
			}
		};
		jQuery.ajax({
			url: altmetricCall,
			success: updatePage,
			dataType: 'json',
			error : that.pageError
		});
	},
	getData : function (theID) {
		var that = this,
			altmetricCall = "http://api.altmetric.com/v1/details/" + theID,
			key = {'key' : '2605fc2ea486dd4e5b8c9c7edc768b51'};

			function updatePage(data) {
				that.response = data;
				that.setData();
			};
			jQuery.ajax({
			url: altmetricCall,
			data: key,
			success: updatePage,
			dataType: 'json',
			error : that.pageError
		});   
	},
	checkTranslate: function (key) {
		var that = this;
		for (var match in that.equivalents) {
			if (match == key) {
				var key = that.equivalents[match];
			}
		}
		return key
	},
	setDate : function (data) {
		if(typeof data == "number" || data.length > 7){
			var d = new Date(data*1000);
			if (d.getMonth && d.toDateString() !== ( "Invalid Date" || "Undefined")) {
	    		return d.toDateString()
			} else {
				return data
			};
		}
	},
	setCohort: function (key) {
		var that = this;
		var citeService = {'sci' : 'Research Scientist' , 'pub' : 'Public Practitioner', 'com' : 'Science Communicators' , 'doc' : 'Doctors'};
		for(var match in citeService) {
			if(match == key) {
				var key = citeService[match];
			}
		}
		return key;
	},
	setHistory: function(data) {
		var that = this;
		var titles = [ 'Date', 'Score'];
		that.history = that.setTable(data, titles);

	},
	setImage: function(data) {
		var theImage = "";
		_.each(data, function (value, key, list){
			if(value){
				theImage += "<img src='" + value  + "' alt='" + key + "' class='altmetrics-img' />";
			};
		});
		return theImage;
	},
	setContext: function(data, key) {
		var that = this,
			titles,
			logs,
		context = $('<div class="context"></div>');
		context.append("<h3>Context</h3>"); 
		_.each(data, function (value, key, list){
			titles = key;
			if(key === "subject") {
				for(var logs in value){
					titles += " - " + logs;
				}
			}
			context.append(that.setTable(value, titles));
		});
		return context;
	},
	setPosts : function (data) {
		var that = this;
		var forTheDom;
		var Thetext = $("#table-template").html();
		forTheDom = $('<div class="posts"></div>');
		that.posts = data;
		_.each(data, function (value, key, list) {
		
			forTheDom.append("<h3>" + key + "</h3>");
			var output = _.template(Thetext, {posts: that.posts[key]});
			forTheDom.append(output);
		});
		return forTheDom;
	
			
	//	
		//return forTheDom;
	},
	setData : function () {
		var that = this, 
			switcher = { 
			"history" : "setHistory",
			"images" : "setImage",
			"context" : "setContext",
			"posts" :"setPosts"
		},
		dates = [ "added_on","published_on","last_updated", "added_on"],
		methodtoInit,
		processedObject,
		forTheDom = $('<div id="holder"></div>');
	
		if(that.response != null) {
			_.each(that.response, function (value, key, list) {
				//matches response list to relevant method in switcher
				if (switcher[key]) {
					methodtoInit = switcher[key];
					processedObject = that[methodtoInit](value, key);
					if (processedObject === undefined) {
						forTheDom.append(that[key]);		
					} else {
						forTheDom.append(processedObject);
					};
					
				} else if (value.isArray) {
					var arrayItems = "<h3>" + key + "</h3>";
					arrayItems += "<ul>";
					_.each(value, function (value, key, list) {
						arrayItems += "<li>" + value + "</li>";
					});
					arrayItems += '</ul>';
					forTheDom.append(arrayItems);

				} else if (typeof value === "object") {
					var detailList =  "<h3>" + key + "</h3>";
					detailList += "<dl>";
					_.each(value, function (value, key, list){
							key = that.setCohort(key);	
							detailList += "<dt>" + key  + "</dt> <dd>" + value  + "</dd>";	
					})
					detailList	+= "</dl>";
					forTheDom.append(detailList);	
				} else if (typeof value === 'string' || typeof value === 'number' ) {
				 	var element =  "<h3>" + key + "</h3>";
					element += '<div class="entry" >' + value + '</div>';
					forTheDom.append(element);
				}

			});
			that.resultHolder.append(forTheDom);
			return true;
		};
	},	
	setRow : function (rowData) {
			var theRow = "<tr>"
			_.each(rowData, function(key, value){
				theRow += "<td>" + key + "</td>";
			});
			theRow += "</tr>"
			return theRow
	},

	// supply data and array of titles
	setTable : function (data, titles) {

		//recieves array and sets a row
		var that = this;
		var theTable = "<table class='table'><tr><thead><tr>";

		if(titles && titles.isArray) {
		 _.each(titles, function (value, key){
			theTable +=	"<th>" + value +"</th>"
		});
		} else {
			theTable +=	"<th>" + titles +"</th><th></th>"			
		}
		theTable += "</tr></thead><tbody>";

		_.each(data, function (value, key, list){
			//console.log(key);
			
			if(typeof value == "object" ) {
				_.each(value, function (value, key, list){
					var rowData = [key,value];
					theTable += that.setRow(rowData);
				});
			} else {
				var rowData = [key,value];
				theTable += that.setRow(rowData);
			}
		});
		theTable += "</tbody></table>"
		return theTable;

	},
	init : function() {

		var that = this;
		if(that.resultHolder) {
			$('body').append("<p class='error-message'>Incorrect DOI please try again</p>");
			$('#this-form').submit(function(event){
				$(".error-message").fadeOut();
				var theDoi = $('#this-form').serializeArray();
				that.doi = theDoi[0].value;
				that.resultHolder.empty();
				that.resultHolder.hide();
				that.getId();
				that.resultHolder.fadeIn();
				event.preventDefault();
			});
		};

	}
}

	$(document).ready(function () {
		var theAltData = Object.create(dataHolder);
		theAltData.doi = '10.1038/480426a';
		theAltData.resultHolder = $('#results');
		theAltData.init();

	});
