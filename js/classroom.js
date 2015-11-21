/**
 * classroom.js
 *
 * Adds annotation (paper.js) to presentation slides (reveal.js).
 */
(function() {
  var path = null,
      matrix = null;


  //
  // io.socket connections
  //
  var options = Reveal.getConfig().classroom;
	var socket = io.connect(options.url);

  var canvasToIndex = function (canvas) {
    var slides = document.getElementsByTagName("SECTION");
    for (var i = 0; i < slides.length; i++) {

      var children = slides[i].childNodes;
      for (var j = 0; j < children.length; j++) {

        if (children[j].tagName == "CANVAS") {
          if (children[j] == canvas) {
            return i;  // Found the canvas, return the index of the slide
          } else {
            break;     // Found a canvas, but not the right one; look at next slide
          }
        }
      }
    }

    return -1;
  };


  socket.on(options.id, function(data) {
    console.log("DATA");
    console.log(data);
    if (data.socketId !== options.id) { return; }

    // activate the paper.js project for the slide that was drawn on, so the
    // drawn path appears on the correct slide
    var currentProject = paper.project;
    if (paper.projects[data.index] != currentProject)
      paper.projects[data.index].activate();

    // add the path, scale it, and draw it
    var path = new paper.Path();
    path.importJSON(data.path);


    paper.project.view.update();
    console.log(path);

    // restore the original state
    if (paper.project != currentProject)
      paper.project = currentProject;
  });


  var notify = function (path) {
    // Find the slide that the path is on
    var slideIndex = canvasToIndex(path.project.view.element);

    // Send the stroke as though the scale was at 1.00
    //if (canvasInZoomedCoords)
    //  path = path.clone(false).scale(1 / Reveal.getScale(), new paper.Point(0, 0));

    // Build the data about the path
    var pathData = {
      path: path.exportJSON({asString: false}),
      index: slideIndex,
      secret: options.secret,
      socketId: options.id
    };

    // Send the path to the server
    // TODO: Create our own channel for path
    socket.emit('slidechanged', pathData);
  };


  var injectCanvas = function (slide) {
    var canvas = document.createElement("canvas");
    slide.insertBefore(canvas, slide.firstChild);

    paper.setup(canvas);
    return canvas;
  };


  var activateCanvasOnSlide = function (slide) {
    // Find the canvas for the slide
    var canvas = null;

    var children = slide.childNodes;
    for (var i = 0; i < children.length; i++) {
      if (children[i].tagName == "CANVAS") {
        canvas = children[i];
        break;
      }
    }

    // If one does not exist, inject one
    if (canvas == null) {
      canvas = injectCanvas(slide);
    }

    // Activate the paper project for the canvas
    for (var i = 0; i < paper.projects.length; i++) {
      if (paper.projects[i].view.element == canvas) {
        paper.projects[i].activate();

        canvas.width = 960;
        canvas.height = 700;

        paper.view.update(true);

        console.log(" == activateCanvasOnSlide == ");
        console.log(paper.view.viewSize);
        console.log(paper.view.resolution);
        console.log(paper.view.pixelRatio);


        console.log("Activated canvas!");
        break;
      }
    }
  };


  var onMouseDown = function (e) {
    path = new paper.Path();
    path.strokeColor = pathStrokeColor;
    path.strokeWidth = pathStrokeWidth;
    path.strokeCap = 'round';
    //path.fullySelected = true;

    matrix = new paper.Matrix().scale(1 / Reveal.getScale());
  };

  var onMouseDrag = function (e) {
    // If a user starts to draw a stroke inside of the <canvas> and then leaves
    // the area, only Chrome continues to fire events.  We want to ignore the
    // events on other parts of the page.
    if (e.event.srcElement && e.event.srcElement.tagName !== "CANVAS") { return; }
    path.add(e.point.transform(matrix));
  };

  var onMouseUp = function (event) {
    path.selected = false;
    path.simplify();
    notify(path);
  }

  var tool = new paper.Tool();
  tool.onMouseDown = onMouseDown;
  tool.onMouseDrag = onMouseDrag;
  tool.onMouseUp = onMouseUp;
  tool.activate();

  // Ensure the current slide's canvas is activate
  activateCanvasOnSlide(Reveal.getCurrentSlide());

  // When the slide changes, update the active canvas
  Reveal.addEventListener('slidechanged', function(event) {
      activateCanvasOnSlide(event.currentSlide);
  });


  // Force a redraw on resize (fixed random resize bugs)
  window.addEventListener("resize", function (e) {
    paper.view.update(true);
  });


})();
