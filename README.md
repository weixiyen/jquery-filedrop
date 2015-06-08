jQuery filedrop plugin
======================

HTML5 drag desktop files into browser
-------------------------------------

jQuery filedrop uses the HTML5 File API to allow users
to drag multiple files from desktop to the browser, uploading
each file to a user-specified URL.

filedrop uses HTML5 FileReader() to read file data.

Browser Support
---------------
Works on Chrome, Firefox 3.6+, IE10+, and Opera 12+.

Would love contribution for Safari support.

filedrop also allows users to define functions to handle the `BrowserNotSupported` error.

Usage Example
---------------

```javascript
$('#dropzone').filedrop({
	fallback_id: 'upload_button',   // an identifier of a standard file input element, becomes the target of "click" events on the dropzone
	fallback_dropzoneClick : true,  // if true, clicking dropzone triggers fallback file selection and the fallback element is made invisible.
	url: 'upload.php',				// upload handler, handles each file separately, can also be a function taking the file and returning a url
	paramname: 'userfile',			// POST parameter name used on serverside to reference file, can also be a function taking the filename and returning the paramname
	withCredentials: true,			// make a cross-origin request with cookies
	data: {
		param1: 'value1', 			// send POST variables
		param2: function(){
			return calculated_data; // calculate data at time of upload
		},
	},
	headers: { 			// Send additional request headers
		'header': 'value'
	},
	error: function(err, file) {
		switch(err) {
			case 'BrowserNotSupported':
				alert('browser does not support HTML5 drag and drop')
				break;
			case 'TooManyFiles':
				// user uploaded more than 'maxfiles'
				break;
			case 'FileTooLarge':
				// program encountered a file whose size is greater than 'maxfilesize'
				// FileTooLarge also has access to the file which was too large
				// use file.name to reference the filename of the culprit file
				break;
			case 'FileTypeNotAllowed':
				// The file type is not in the specified list 'allowedfiletypes'
				break;
			case 'FileExtensionNotAllowed':
				// The file extension is not in the specified list 'allowedfileextensions'
				break;
			default:
				break;
		}
	},
	allowedfiletypes: ['image/jpeg','image/png','image/gif'],	// filetypes allowed by Content-Type.  Empty array means no restrictions
	allowedfileextensions: ['.jpg','.jpeg','.png','.gif'], // file extensions allowed. Empty array means no restrictions
	maxfiles: 25,
	maxfilesize: 20, 	// max file size in MBs
	dragOver: function() {
		// user dragging files over #dropzone
	},
	dragLeave: function() {
		// user dragging files out of #dropzone
	},
	docOver: function() {
		// user dragging files anywhere inside the browser document window
	},
	docLeave: function() {
		// user dragging files out of the browser document window
	},
	drop: function() {
		// user drops file
	},
	uploadStarted: function(i, file, len){
		// a file began uploading
		// i = index => 0, 1, 2, 3, 4 etc
		// file is the actual file of the index
		// len = total files user dropped
	},
	uploadFinished: function(i, file, response, time) {
		// response is the data you got back from server in JSON format.
	},
	progressUpdated: function(i, file, progress) {
		// this function is used for large files and updates intermittently
		// progress is the integer value of file being uploaded percentage to completion
	},
	globalProgressUpdated: function(progress) {
		// progress for all the files uploaded on the current instance (percentage)
		// ex: $('#progress div').width(progress+"%");
	},
	speedUpdated: function(i, file, speed) {
		// speed in kb/s
	},
	rename: function(name) {
		// name in string format
		// must return alternate name as string
	},
	beforeEach: function(file) {
		// file is a file object
		// return false to cancel upload
	},
	beforeSend: function(file, i, done) {
		// file is a file object
		// i is the file index
		// call done() to start the upload
	},
	afterAll: function() {
		// runs after all files have been uploaded or otherwise dealt with
	}
});
```

Queueing Usage Example
----------------------

To enable the upload of a large number of files, a queueing option was added that enables you to configure how many files should be processed at a time.  The upload will process that number in parallel, backing off and then processing the remaining ones in the queue as empty upload slots become available.

This is controlled via one of two parameters:

```javascript
maxfiles: 10    // Limit the total number of uploads possible - default behaviour
queuefiles: 2   // Control how many uploads are attempted in parallel (ignores maxfiles setting)
```

Not setting a value for `queuefiles` will disable queueing.

Contributions
-------------

* [Reactor5](http://github.com/Reactor5/) (Brian Hicks)
* [jpb0104](http://github.com/jpb0104)
* [boughtonp](https://github.com/boughtonp) (Peter Boughton)
