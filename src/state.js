export default class State 
{
    constructor(root, mode, degree, numKeys)
    {
        // modes
        // ionian is typical major scale, aeolian is typical minor scale
        // ionian[0] = 2 means it takes 2 half steps to get from 1st to 2nd note
        // ionian[2] = 1 means it takes 1 half steps to get from 3rd to 4th note
        var ionian =     [2, 2, 1, 2, 2, 2, 1];
        var dorian =     [2, 1, 2, 2, 2, 1, 2];
        var phrygian =   [1, 2, 2, 2, 1, 2, 2];
        var lydian =     [2, 2, 2, 1, 2, 2, 1];
        var mixolydian = [2, 2, 1, 2, 2, 1, 2];
        var aeolian =    [2, 1, 2, 2, 1, 2, 2];
        var locrian =    [1, 2, 2, 1, 2, 2, 2];
        this.modes = [ionian, dorian, phrygian, lydian, mixolydian, aeolian, locrian];

        // probabilities of chord progressions
        // progressions[0][0] means there is a 0.10 chance to get from I to I
        // progressions[4][0] means there is a 0.95 chance ot get from V to I
        // see diagrams here:
        // http://www.angelfire.com/music/HarpOn/image/chordprogmaj.gif
        // http://www.angelfire.com/music/HarpOn/image/chordprogmin.gif
        this.progressions = [
            [0.00, 0.15, 0.15, 0.20, 0.20, 0.15, 0.15],
            [0.00, 0.00, 0.00, 0.00, 0.70, 0.00, 0.30],
            [0.00, 0.00, 0.00, 0.20, 0.00, 0.80, 0.00],
            [0.20, 0.20, 0.00, 0.00, 0.50, 0.00, 0.10],
            [0.60, 0.00, 0.00, 0.00, 0.00, 0.40, 0.00],
            [0.00, 0.45, 0.00, 0.30, 0.25, 0.00, 0.00],
            [0.70, 0.00, 0.00, 0.00, 0.30, 0.00, 0.00]];

        // check if all rows in progressions add up to 1.0
        for (var i = 0; i < this.progressions.length; i++) {
            var sumProbability = 0.0;
            for (var j = 0; j < this.progressions[i].length; j++) {
                sumProbability += this.progressions[i][j];
            }
            if (Math.abs(1.0 - sumProbability) > 0.001) {
                console.log("ERROR: progression probability for row " + i 
                    + " does not add up to 1.0.");
            }
        }
    
        // starting note of the scale, index on the piano keyboard
        this.root = root;
        // mode, the type of scale: ionian, dorian, etc.
        this.mode = mode;
        // degree, location on the scale
        // I   II  III  IV  V   VI  VII
        // 0   1    2   3   4   5    6
        this.degree = degree;
        // number of keys on the piano keyboard
        this.numKeys = numKeys;
    }


    doProgression()
    {
        var progressionOptions = this.progressions[this.degree];
        var newDegree = this.degree;
        var seed = Math.random();
        var sumProbability = 0.0;
        // iterate through the probabilities to figure out new degree
        for (var i = 0; i < progressionOptions.length; i++) {
            sumProbability += progressionOptions[i];
            if (seed < sumProbability) { 
                newDegree = i; 
                break; 
            }
        }
        console.log("newDegree (in roman): " + (newDegree + 1));
        
        // find new degree chord notes in piano keyboard indices 
        var currMode = this.modes[this.mode];
        var note1 = this.root;
        for (var i = 0; i < newDegree; i++) {
            note1 += currMode[i];
        }
        var note2 = note1;
        for (var i = newDegree; i < newDegree + 2; i++) {
            note2 += currMode[i % currMode.length];
        }
        var note3 = note2;
        for (var i = newDegree + 2; i < newDegree + 4; i++) {
            note3 += currMode[i % currMode.length];
        }

        // inversion
        var inversion = this.doInversion(note1, note2, note3, this.root);

        // update
        this.degree = newDegree;

        // play one, two, or three notes of the chord
        // together or arpeggio
        // var output = [[note1, note2, note3], [3]]
        var output = [inversion, this.doArpeggio(inversion.length)];
        return output;
    }


    doModulation()
    {
        // generates a number from 1 to 11
        var offset = Math.ceil(11.0 * Math.random());
        var signSeed = Math.random();
        var sign;
        if (sign < 0.5) { sign = -1; } else { sign = 1; }
        var newRoot;
        if (this.root + offset >= this.numKeys) {
            newRoot = this.root - offset;
        }
        else if (this.root - offset < 0) {
            newRoot = this.root + offset;
        }
        else {
            newRoot = this.root + sign * offset;
        }
        var newMode = Math.floor(Math.random() * this.modes.length);

        console.log(" ");
        console.log("doing modulation");
        console.log("oldRoot: " + this.root);
        console.log("oldMode: " + this.mode);
        console.log("newRoot: " + newRoot);
        console.log("newMode: " + newMode);

        // compare all chords between two roots/modes 
        // find chords with no difference (diatonic) or half step difference (altered)
        // https://www.artofcomposing.com/the-art-of-modulation-part-2-common-chord-modulation
        var diatonic = [];
        var oldAltered = [];
        var newAltered = [];
        var oldStartNote = this.root;
        for (var i = 0; i < this.modes[this.mode].length; i++)
        {
            var oldNote1 = oldStartNote;
            var oldNote2 = oldStartNote + this.modes[this.mode][i] + this.modes[this.mode][i + 1];
            var oldNote3 = oldNote2 + this.modes[this.mode][i + 2] + this.modes[this.mode][i + 3];

            var newStartNote = newRoot;
            for (var j = 0; j < this.modes[newMode].length; j++)
            {
                var newNote1 = newStartNote;
                var newNote2 = newStartNote + this.modes[newMode][j] + this.modes[newMode][j + 1];
                var newNote3 = newNote2 + this.modes[newMode][j + 2] + this.modes[newMode][j + 3];
                
                // modding by 12 removes octaves
                var diffNote1 = Math.abs((newNote1 % 12) - (oldNote1 % 12));
                var diffNote2 = Math.abs((newNote2 % 12) - (oldNote2 % 12));
                var diffNote3 = Math.abs((newNote3 % 12) - (oldNote3 % 12));

                // chords have no difference
                if (diffNote1 + diffNote2 + diffNote3 == 0)
                {
                    diatonic.push([newNote1, newNote2, newNote3, j]);
                }
                // chords have half step difference, but base note must be same
                else if (diffNote1 == 0 && diffNote2 + diffNote3 == 1.0)
                {
                    oldAltered.push([oldNote1, oldNote2, oldNote3, j]);
                    newAltered.push([newNote1, newNote2, newNote3, j]);
                }

                // shift the start note to next one in old mode
                newStartNote += this.modes[newMode][j];
            }

            // shift the start note to the next one in new mode
            oldStartNote += this.modes[this.mode][i];
        }

        if (diatonic.length == 0 && oldAltered.length == 0 && newAltered.length == 0)
        {
            console.log(" ");
            console.log("no common chord found, switching to progression");
            console.log(" ");
            return this.doProgression();
        }

        var outputNotes = [];
        var outputCount = [];
        // play old altered first
        // play diatonic in the middle
        // play new altered last
        for (var i = 0; i < oldAltered.length; i++)
        {
            console.log("old altered " + oldAltered[i][0] + " " + oldAltered[i][1] + " " + oldAltered[i][2]);
            // outputNotes.push(oldAltered[i][0]);
            // outputNotes.push(oldAltered[i][1]);
            // outputNotes.push(oldAltered[i][2]);
            // outputCount.push(3);
            var inversion = this.doInversion(oldAltered[i][0], oldAltered[i][1], oldAltered[i][2], this.root);
            for (var j = 0; j < inversion.length; j++)
            {
                outputNotes.push(inversion[j]);
            }
            var arpeggio = this.doArpeggio(inversion.length);
            for (var j = 0; j < arpeggio.length; j++)
            {
                outputCount.push(arpeggio[j]);
            }

            this.degree = oldAltered[i][3];
        }
        for (var i = 0; i < diatonic.length; i++)
        {
            console.log("diatonic " + diatonic[i][0] + " " + diatonic[i][1] + " " + diatonic[i][2]);
            // outputNotes.push(diatonic[i][0]);
            // outputNotes.push(diatonic[i][1]);
            // outputNotes.push(diatonic[i][2]);
            // outputCount.push(3);
            var inversion = this.doInversion(diatonic[i][0], diatonic[i][1], diatonic[i][2], newRoot);
            for (var j = 0; j < inversion.length; j++)
            {
                outputNotes.push(inversion[j]);
            }
            var arpeggio = this.doArpeggio(inversion.length);
            for (var j = 0; j < arpeggio.length; j++)
            {
                outputCount.push(arpeggio[j]);
            }

            this.degree = diatonic[i][3];
        }
        for (var i = 0; i < newAltered.length; i++)
        {
            console.log("new altered " + newAltered[i][0] + " " + newAltered[i][1] + " " + newAltered[i][2]);
            // outputNotes.push(newAltered[i][0]);
            // outputNotes.push(newAltered[i][1]);
            // outputNotes.push(newAltered[i][2]);
            // outputCount.push(3);
            var inversion = this.doInversion(newAltered[i][0], newAltered[i][1], newAltered[i][2], newRoot);
            for (var j = 0; j < inversion.length; j++)
            {
                outputNotes.push(inversion[j]);
            }
            var arpeggio = this.doArpeggio(inversion.length);
            for (var j = 0; j < arpeggio.length; j++)
            {
                outputCount.push(arpeggio[j]);
            }
            
            this.degree = newAltered[i][3];
        }
        console.log(" ");

        // update
        this.root = newRoot;
        this.mode = newMode;

        var output = [outputNotes, outputCount];
        return output;
    }


    normalizeDistribution(list)
    {
        var normalizedList = list;
        var magnitude = 0.0;

        for (var i = 0; i < list.length; i++)
        {
            magnitude += list[i];
        }

        for (var i = 0; i < normalizedList.length; i++)
        {
            normalizedList[i] /= magnitude;
        }

        return normalizedList;
    }


    doInversion(note1, note2, note3, mean)
    {
        var baseNote1 = note1 % 12;
        var baseNote2 = note2 % 12;
        var baseNote3 = note3 % 12;
        var possibleNotes = [];
        var probabilities = [];

        // get list of all chord notes on the keyboard
        while (baseNote1 < this.numKeys && 
               baseNote2 < this.numKeys && 
               baseNote3 < this.numKeys)
        {
            possibleNotes.push(baseNote1);
            possibleNotes.push(baseNote2);
            possibleNotes.push(baseNote3);
            baseNote1 += 12;
            baseNote2 += 12;
            baseNote3 += 12;
        }

        // console.log("possible notes " + possibleNotes);

        // calculates the gaussian distribution weighting
        // one distribution has center of list as highest weight
        // another distribution has mean as highest weight
        // this skews to play notes near the center and mean
        // https://en.wikipedia.org/wiki/Gaussian_function
        // solve for variance
        // https://en.wikipedia.org/wiki/Normal_distribution#/media/File:Empirical_Rule.PNG
        for (var i = 0 ; i < possibleNotes.length; i++)
        {
            // gaussian for notes near mean
            var amplitude = 1.0;
            var variance2 = 6 * 6;
            var x2 = (possibleNotes[i] - mean) * (possibleNotes[i] - mean);
            var noteProbability = amplitude * Math.pow(2.71828, -0.5 * x2 / variance2);
            probabilities[i] = noteProbability;

            // gaussian for notes near center of list
            amplitude = 1.0;
            variance2 = (this.numKeys / 2.0 / 3.0) * (this.numKeys / 2.0 / 3.0);
            x2 = Math.floor(this.numKeys / 2.0) * Math.floor(this.numKeys / 2.0);
            noteProbability = amplitude * Math.pow(2.71828, -0.5 * x2 / variance2)
            probabilities[i] += noteProbability;
        }

        // console.log("probabilities " + probabilities);
        
        var output = [];
        var numNotes = Math.round(4 * Math.random() + 2);
        var countNotes = 0;
        while (countNotes < numNotes)
        {   
            probabilities = this.normalizeDistribution(probabilities);
            var seed = Math.random();
            var sumProbability = 0.0;
            // iterate through the probabilities to figure out new degree
            for (var i = 0; i < probabilities.length; i++) {
                sumProbability += probabilities[i];
                if (seed < sumProbability) { 
                    output.push(possibleNotes[i]);
                    probabilities[i] = 0.0; 
                    break; 
                }
            }

            countNotes++;
        }

        console.log("inversion " + output);
        return output;
    }


    doArpeggio(numNotes)
    {
        var outputCount = [];
        var countNotes = 0;
        while (countNotes < numNotes)
        {
            var seed = Math.ceil((numNotes - countNotes) * Math.random());
            outputCount.push(seed);
            countNotes += seed;
        }
        return outputCount;
    }

}

