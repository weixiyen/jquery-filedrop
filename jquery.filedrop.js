/*
 * Default text - jQuery plugin for html5 dragging files from desktop to browser
 *
 * Author: Weixi Yen
 *
 * Email: [Firstname][Lastname]@gmail.com
 * 
 * Copyright (c) 2010 Resopollution
 * 
 * Licensed under the MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Project home:
 *   http://www.github.com/weixiyen/jquery-filedrop
 *
 * Version:  0.1.0
 *
 * Features:
 *      Allows sending of extra parameters with file.
 *      Works with Firefox 3.6+
 *      Future-compliant with HTML5 spec (will work with Webkit browsers and IE9)
 * Usage:
 * 	See README at project homepage
 *
 */
(function($){
    
	var opts = {},
		default_opts = {
			url: '',
			refresh: 1000,
			paramname: 'userfile',
			maxfiles: 25,
			maxfilesize: 1, // MBs
			data: {},
			drop: empty,
			dragEnter: empty,
			dragOver: empty,
			dragLeave: empty,
			docEnter: empty,
			docOver: empty,
			docLeave: empty,
			beforeEach: empty,
			afterAll: empty,
			rename: empty,
			error: function(err, file){alert(err);},
			uploadStarted: empty,
			uploadFinished: empty,
			progressUpdated: empty,
			speedUpdated: empty
		},
		errors = ["BrowserNotSupported", "TooManyFiles", "FileTooLarge"],
		doc_leave_timer,
		stop_loop = false,
		files_count = 0,
		files;

	$.fn.filedrop = function(options) {
		opts = $.extend( {}, default_opts, options );
		
		this.get(0).addEventListener("drop", drop, true);
		this.bind('dragenter', dragEnter).bind('dragover', dragOver).bind('dragleave', dragLeave);
		
		document.addEventListener("drop", docDrop, true);
		$(document).bind('dragenter', docEnter).bind('dragover', docOver).bind('dragleave', docLeave);
	};
     
	function drop(e) {
		opts.drop(e);
		files = e.dataTransfer.files;
		files_count = files.length;
		upload();
		e.preventDefault();
		return false;
	}
	
	function getBuilder(filename, filedata, boundary) {
		var dashdash = '--',
			crlf = '\r\n',
			builder = '';

		$.each(opts.data, function(i, val) {
	    	if (typeof val === 'function') val = val();
			builder += dashdash;
			builder += boundary;
			builder += crlf;
			builder += 'Content-Disposition: form-data; name="'+i+'"';
			builder += crlf;
			builder += crlf;
			builder += val;
			builder += crlf;
		});
		
		builder += dashdash;
		builder += boundary;
		builder += crlf;
		builder += 'Content-Disposition: form-data; name="'+opts.paramname+'"';
		builder += '; filename="' + filename + '"';
		builder += crlf;
		
		builder += 'Content-Type: application/octet-stream';
		builder += crlf;
		builder += crlf; 
		
		builder += filedata;
		builder += crlf;
        
		builder += dashdash;
		builder += boundary;
		builder += dashdash;
		builder += crlf;
		return builder;
	}

	function progress(e) {
		if (e.lengthComputable) {
			var percentage = Math.round((e.loaded * 100) / e.total);
			if (this.currentProgress != percentage) {
				
				this.currentProgress = percentage;
				opts.progressUpdated(this.index, this.file, this.currentProgress);
				
				var elapsed = new Date().getTime();
				var diffTime = elapsed - this.currentStart;
				if (diffTime >= opts.refresh) {
					var diffData = e.loaded - this.startData;
					var speed = diffData / diffTime; // KB per second
					opts.speedUpdated(this.index, this.file, speed);
					this.startData = e.loaded;
					this.currentStart = elapsed;
				}
			}
		}
	}
    
    
    
	function upload() {
		stop_loop = false;
		if (!files) {
			opts.error(errors[0]);
			return false;
		}
		var filesDone = 0,
			filesRejected = 0;
		
		if (files_count > opts.maxfiles) {
		    opts.error(errors[1]);
		    return false;
		}

		for (var i=0; i<files_count; i++) {
			if (stop_loop) return false;
			try {
				if (beforeEach(files[i]) != false) {
					if (i === files_count) return;
					var reader = new FileReader(),
						max_file_size = 1048576 * opts.maxfilesize;
						
					reader.index = i;
					if (files[i].size > max_file_size) {
						opts.error(errors[2], files[i]);
						return false;
					}
					
					reader.addEventListener("loadend", send, false);
					reader.readAsBinaryString(files[i]);
				} else {
					filesRejected++;
				}
			} catch(err) {
				opts.error(errors[0]);
				return false;
			}
		}
	    
		function send(e) {
			// Sometimes the index is not attached to the
			// event object. Find it by size. Hack for sure.
			if (e.target.index == undefined) {
				e.target.index = getIndexBySize(e.total);
			}
			
			var xhr = new XMLHttpRequest(),
				upload = xhr.upload,
				file = files[e.target.index],
				index = e.target.index,
				start_time = new Date().getTime(),
				boundary = '------multipartformboundary' + (new Date).getTime(),
				builder;
				
			newName = rename(file.name);
			if (typeof newName === "string") {
				builder = getBuilder(newName, e.target.result, boundary);
			} else {
				builder = getBuilder(file.name, e.target.result, boundary);
			}
			
			upload.index = index;
			upload.file = file;
			upload.downloadStartTime = start_time;
			upload.currentStart = start_time;
			upload.currentProgress = 0;
			upload.startData = 0;
			upload.addEventListener("progress", progress, false);
			
			xhr.open("POST", opts.url, true);
			xhr.setRequestHeader('content-type', 'multipart/form-data; boundary=' 
			    + boundary);
			    
			xhr.sendAsBinary(builder);  
			
			opts.uploadStarted(index, file, files_count);  
			
			xhr.onload = function() { 
			    if (xhr.responseText) {
				var now = new Date().getTime(),
				    timeDiff = now - start_time,
				    result = opts.uploadFinished(index, file, jQuery.parseJSON(xhr.responseText), timeDiff);
					filesDone++;
					if (filesDone == files_count - filesRejected) {
						afterAll();
					}
			    if (result === false) stop_loop = true;
			    }
			};
		}
	}
    
	function getIndexBySize(size) {
		for (var i=0; i < filesCount; i++) {
			if (files[i].size == size) {
				return i;
			}
		}
		
		return undefined;
	}
    
	function rename(name) {
		return opts.rename(name);
	}
	
	function beforeEach(file) {
		return opts.beforeEach(file);
	}
	
	function afterAll() {
		return opts.afterAll();
	}
	
	function dragEnter(e) {
		clearTimeout(doc_leave_timer);
		e.preventDefault();
		opts.dragEnter(e);
	}
	
	function dragOver(e) {
		clearTimeout(doc_leave_timer);
		e.preventDefault();
		opts.docOver(e);
		opts.dragOver(e);
	}
	 
	function dragLeave(e) {
		clearTimeout(doc_leave_timer);
		opts.dragLeave(e);
		e.stopPropagation();
	}
	 
	function docDrop(e) {
		e.preventDefault();
		opts.docLeave(e);
		return false;
	}
	 
	function docEnter(e) {
		clearTimeout(doc_leave_timer);
		e.preventDefault();
		opts.docEnter(e);
		return false;
	}
	 
	function docOver(e) {
		clearTimeout(doc_leave_timer);
		e.preventDefault();
		opts.docOver(e);
		return false;
	}
	 
	function docLeave(e) {
		doc_leave_timer = setTimeout(function(){
			opts.docLeave(e);
		}, 200);
	}
	 
	function empty(){}
     
})(jQuery);