
const THREE = require('three'); // older modules are imported like this. You shouldn't have to worry about this much
import Framework from './framework'

//sound
var listener = new THREE.AudioListener();
var audioLoader = new THREE.AudioLoader();

var order = new Array();
// index = 40, in other words, order[40] is middle C on piano
var index = 40; 
var length = 84;
var firstStep = true;
var startTime = Date.now();
var direction = 1;
// time interval between keys, in milliseconds
var timeInterval = 500; 
// see image of electronic keyboard to understand indexing:
// https://images-na.ssl-images-amazon.com/images/I/81uw9BUrzTL._SL1500_.jpg
// A0, Bb0, B0, C1, Db1, D1, ... Bb7, B7, C8
var notes = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
var pianoLoadCount = 0;


// modes
// ionian[0] = 2 means it takes 2 half steps to get from 1st to 2nd note
// ionian[2] = 1 means it takes 1 half step to get from 3rd to 4th note
var ionian =     [2, 2, 1, 2, 2, 2, 1];
var dorian =     [2, 1, 2, 2, 2, 1, 2];
var phygian =    [1, 2, 2, 2, 1, 2, 2];
var lydian =     [2, 2, 2, 1, 2, 2, 1];
var mixolydian = [2, 2, 1, 2, 2, 1, 2];
var aeolian =    [2, 1, 2, 2, 2, 1, 2];
var locrian =    [2, 1, 2, 1, 2, 2, 2];

var mode = ionian;
var modeIndex = 0;

// keeps track of which notes to play next
var notesQueue = [];
// keeps track of number of notes to play at once next
var countQueue = [];

function generateNotes()
{
  // step one is to choose the mode
  var random = Math.floor(Math.random() * 2);
  switch (random) {
    case 0: 
      mode = ionian;
      break;
    case 1:
      mode = aeolian;
      break;
    default:
      mode = ionian;
  }

  random = Math.floor(Math.random() * 2);

  if (random == 0 && index + mode[0] + mode[1] + mode[2] + mode[3] < length)
  {
    notesQueue.push(index);
    notesQueue.push(index + mode[0] + mode[1]);
    notesQueue.push(index + mode[0] + mode[1] + mode[2] + mode[3]);
    countQueue.push(1);
    countQueue.push(1);
    countQueue.push(1);
    index = index + mode[0] + mode[1] + mode[2] + mode[3];
  }
  else if (random == 1 && index - mode[3] - mode[2] - mode[1] - mode[0] >= 0)
  {
    notesQueue.push(index);
    notesQueue.push(index - mode[3] - mode[2]);
    notesQueue.push(index - mode[3] - mode[2] - mode[1] - mode[0]);
    countQueue.push(1);
    countQueue.push(1);
    countQueue.push(1);
    index = index - mode[3] - mode[2] - mode[1] - mode[0];
  }

}

// called after the scene loads
function onLoad(framework) 
{
  var scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var controls = framework.controls;
  //var gui = framework.gui;
  //var stats = framework.stats;

  // load all the piano key mp3 files
  for (var i = 0; i < length; i++)
  {
    // why we have to use a try catch statement for loading, or else i = (length - 1) for all
    // https://dzone.com/articles/why-does-javascript-loop-only-use-last-value
    try { throw i }
    catch (key) 
    {
      setTimeout(function()
      {
        // we are skipping A0, Bb0, B0, and C8
        audioLoader.load( './sounds/piano/' + notes[key % 12] + (Math.floor(key / 12) + 1) + '.mp3', function( buffer ) 
        {
          order[key] = new THREE.Audio(listener);
          order[key].name = notes[key % 12] + (Math.floor(key / 12) + 1);
          order[key].setBuffer( buffer );
          order[key].setVolume(1.0);
          pianoLoadCount++;
        });

      }, 1000);
    }

  }

}

// called on frame updates
function onUpdate(framework) 
{
  // play notes next on notesQueue every time interval
  // double check all piano sounds loaded
  if (Math.abs(Date.now() - startTime) >= timeInterval && pianoLoadCount >= length)
  {

    var count = countQueue.shift();
    for (var i = 0; i < count; i++)
    {
      var noteIndex = notesQueue.shift();
      // if the note is still playing, stop and play it again
      if (order[noteIndex].isPlaying) { order[noteIndex].stop(); }
      order[noteIndex].play();
    }

    if (notesQueue.length < 100)
    {
      generateNotes();
    }

    startTime = Date.now();
  }

}


// when the scene is done initializing, it will call onLoad, then on frame updates, call onUpdate
Framework.init(onLoad, onUpdate);
