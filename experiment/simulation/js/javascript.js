var preCon = null;
//update the x and y coordinate
var update = function (x, y) {
    var tempX = document.getElementById("mouseX");
    var tempY = document.getElementById("mouseY");
    if (tempX && tempY) {
        tempX.innerHTML = x;
        tempY.innerHTML = y;
    }
};

var Terminal = function () {
    this.obj = document.getElementById("terminal");
    this.obj.innerHTML = ">>";
    this.update = function (str) {
        this.value = this.obj.innerHTML;
        this.value += str + "<br>>>";
        this.obj.innerHTML = this.value;
        this.obj.scrollTo(0, this.obj.scrollHeight);
    }
    this.reset = function () {
        this.obj.innerHTML = "";
    }
}

var getMousePos = function (canvas, e) {
    var boundingClientRect = canvas.getBoundingClientRect();
    var tx = e.clientX - boundingClientRect.left;
    var ty = e.clientY - boundingClientRect.top;
    return {
        x: tx < 0 ? 0 : tx,
        y: ty < 0 ? 0 : ty
    };
};

var pointType = {
    PASSIVE: 0x00,
    ACTIVE: 0x01,
    ACTIVE_PASSIVE: 0x02
};

var operationType = {
    DRAW_POINT: 0X00,
    DRAW_TWO_WAY_KEY: 0X01,
    DRAW_RESISTOR: 0X02,
    DRAW_CELL: 0X03,
    DRAW_GALVANOMETER: 0X04,
    DRAW_POTENTIOMETER: 0X05,
    DRAW_CONDENSER: 0X06,
    DRAW_TAPKEY: 0x07,

    MAKE_CONNECTION: 0X13,
    START_SIMULATION: 0X14,
    STOP_SIMULATION: 0X15,

    START_CHARGING: 0X31,
    STOP_CHARGING: 0x41,
    START_DISCHARGING: 0X32,
    STOP_DISCHARGING: 0x42,
    READ_DEFLACTION: 0X33,

    DISCHARGE: 0X50,

    RESET: 0X21,
    UNDO: 0X22,
    REDO: 0X23
};

var level = {
    LOW: false,
    HIGH: true
};

var conMap = {
    Z: ["GA", "CA", "RA", "BA", "K2A"],
    RA: ["Z", "BA"],
    CA: ["Z"],
    GA: ["Z", "K2A"],
    BA: ["Z"],
    K2A: ["GA", "Z"],
    GB: ["K2I", "K3A"],
    K3A: ["GB", "K2I"],
    K3I: ["K0A", "K3", "K3A"],
    K2I: ["GB", "K3A", "K2A", "K2"],
    K0A: ["K3I", "K0I"],
    K0I: ["CB", "K1I", "K0B", "K0A"],
    K1I: ["CB", "K0I", "K1A", "K1"],
    CB: ["K0I", "K1I"],
    K1A: ["RB"],
    RB: ["K1A"],
    K0B: ["BB", "K0I"],
    BB: ["K0B"]
};
var previousKey = null;

var point = function (canvasId, imageId, x, y, r, type, name, element) {
    this.name = name;
    this.connection = [];
    this.V = 0;
    this.type = type;
    this.level = level.LOW;
    this.image = imageId;
    this.point = { x: x, y: y, r: r };
    this.device = element;
    this.draw = function () {
        if (this.image == null) {
            canvas.context.beginPath();
            canvas.context.arc(this.point.x, this.point.y, this.point.r, 0, 2 * Math.PI);
            canvas.context.lineWidth = "5";
            canvas.context.strokeStyle = "black";
            canvas.context.stroke();
            canvas.context.closePath();

            canvas.context.font = "12px Arial";
            canvas.context.fillStyle = "black";
            canvas.context.fillText(name, this.point.x - 10, this.point.y - 12);

            canvas.context.font = "12px Arial";
            //canvas.context.fillText(this.V, this.point.x - 10, this.point.y + 22);
        }
    };
    this.isInside = function (x, y) {
        if (canvas.action != operationType.START_SIMULATION) {
            var d = Math.pow(x - this.point.x, 2) + Math.pow(y - this.point.y, 2)
            d = Math.sqrt(d);
            var temp = canvas.action;
            if (d <= parseFloat(this.point.r)) {
                canvas.action = operationType.MAKE_CONNECTION;
                return true;
            }
            canvas.action = temp;
        }
        return false;
    };
    this.update = function () {
        if (this.type == pointType.ACTIVE) {

        } else {

        }
    }
};

var Wire = function (a, b, tilt) {
    this.a = a;
    this.b = b;

    this.current = 0;
    this.tilt = tilt;
    this.color = null;
    this.flag = false;

    this.draw = function () {
        this.flag = conMap[this.a.device == null ? this.a.name : this.a.device.name + this.a.name].includes(this.b.device == null ? this.b.name : this.b.device.name + this.b.name);
        if (this.flag)
            this.color = "green";
        else {
            this.color = "red";
            terminal.update("wrong connection use 'ctrl+z' to undo");
        }

        canvas.context.beginPath();
        canvas.context.strokeStyle = this.color;
        //canvas.context.fill("grey");
        canvas.context.lineWidth = 3;
        canvas.context.moveTo(this.a.point.x, this.a.point.y);
        if (this.tilt) {
            canvas.context.lineTo(this.a.point.x, this.b.point.y);
            canvas.context.lineTo(this.b.point.x, this.b.point.y);
        } else {
            canvas.context.lineTo(this.b.point.x, this.b.point.y);
        }
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.arc(this.a.point.x, this.a.point.y, 3, 0, 2 * Math.PI);
        canvas.context.strokeStyle = this.color;
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.arc(this.b.point.x, this.b.point.y, 3, 0, 2 * Math.PI);
        canvas.context.strokeStyle = this.color;
        canvas.context.stroke();
        canvas.context.closePath();
    }

    this.operate = function () {
        if (this.a.type == pointType.ACTIVE && this.b.type != pointType.ACTIVE) {
            this.b.V = this.a.V;
        } else if (this.b.type == pointType.ACTIVE && this.a.type != pointType.ACTIVE) {
            this.a.V = this.b.V;
        } else if (this.a.type == this.b.type) {
            if (this.a.V > this.b.V) {
                this.a.V = this.a.V;
            } else {
                this.b.V = this.a.V;
            }
        }
    }
};

var TwoWayKey = function (x, y, name) {
    this.width = 50;
    this.height = 50;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.input = new point(canvas.id, null, this.x + 10, this.y + 25, 4, pointType.PASSIVE, "I", this);
    this.outputA = new point(canvas.id, null, this.x + 40, this.y + 10, 4, pointType.PASSIVE, "A", this);
    this.outputB = new point(canvas.id, null, this.x + 40, this.y + 40, 4, pointType.PASSIVE, "B", this);
    this.output = this.outputA;
    this.Wire = null;
    this.name = name;
    this.draw = function () {
        // canvas.context.beginPath();
        // canvas.context.rect(this.x, this.y, this.width, this.height);
        // canvas.context.lineWidth = "1";
        // canvas.context.stroke();
        // canvas.context.closePath();

        canvas.context.font = "12px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText(name, this.x + this.width / 2 - 4, this.y + this.height / 2 + 30);

        this.Wire = new Wire(this.input, this.output, false);
        this.Wire.draw();

        this.input.draw();
        this.outputA.draw();
        this.outputB.draw();

        // canvas.context.beginPath();
        // canvas.context.rect(this.x, this.y, this.width, this.height);
        // canvas.context.stroke();
        // canvas.context.closePath();
    };

    this.isInside = function (x, y) {
        if (x > this.x && y > this.y && x < this.x + this.width && y < this.y + this.height) {
            return true;
        }
        return false;
    };

    this.click = function () {
        if (this.output == this.outputA) {
            this.output = this.outputB;
        } else
            this.output = this.outputA;
        if (this.input.V >= this.output.V) {
            this.output.V = this.input.V;
        } else {
            this.input.V = this.output.V;
        }
        canvas.draw();
        previousKey = this.name;
    };
};

var TapKey = function (x, y, name) {
    this.width = 50;
    this.height = 50;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.input = new point(canvas.id, null, this.x + 40, this.y + 25, 4, pointType.PASSIVE, "I", this);
    this.outputB = new point(canvas.id, null, this.x + 20, this.y + 5, 0, pointType.PASSIVE, "", this);
    this.outputA = new point(canvas.id, null, this.x + 10, this.y + 25, 4, pointType.PASSIVE, "A", this);
    this.output = this.outputB;
    this.Wire = null;
    this.name = name;
    this.isOn = false;
    this.draw = function () {
        // canvas.context.beginPath();
        // canvas.context.rect(this.x, this.y, this.width, this.height);
        // canvas.context.lineWidth = "1";
        // canvas.context.stroke();
        // canvas.context.closePath();

        this.Wire = new Wire(this.input, this.output, false);
        this.Wire.draw();

        canvas.context.font = "12px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText(name, this.x + this.width / 2 - 4, this.y + this.height / 2 + 30);

        this.input.draw();
        this.outputA.draw();
        this.outputB.draw();

        // canvas.context.beginPath();
        // canvas.context.rect(this.x, this.y, this.width, this.height);
        // canvas.context.stroke();
        // canvas.context.closePath();
    };

    this.isInside = function (x, y) {
        if (x > this.x && y > this.y && x < this.x + this.width && y < this.y + this.height) {
            return true;
        }
        return false;
    };

    this.click = function () {
        if (this.output == this.outputA) {
            this.output = this.outputB;
            this.isOn = false;
        } else {
            this.output = this.outputA;
            this.isOn = true;
        }
        if (this.input.V > this.output.V) {
            this.output.V = this.input.V;
        } else {
            this.input.V = this.output.V;
        }
        previousKey = this.name;
        canvas.draw();
    };
};

var Cell = function (x, y, name) {
    this.width = 80;
    this.height = 30;
    this.V = 20;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.A = new point(canvas.id, null, this.x + 3, this.y + this.height / 2, 5, pointType.ACTIVE, "A", this);
    this.B = new point(canvas.id, null, this.x - 3 + this.width, this.y + this.height / 2, 5, pointType.ACTIVE, "B", this);
    this.A.V = this.V;
    this.B.V = 0;
    this.name = name;
    this.draw = function () {
        // canvas.context.beginPath();
        // canvas.context.rect(this.x, this.y, this.width, this.height);
        // canvas.context.lineWidth = "1";
        // canvas.context.stroke();
        // canvas.context.closePath();

        canvas.context.lineWidth = "2";
        canvas.context.strokeStyle = "black";

        canvas.context.beginPath();
        canvas.context.moveTo(this.x + 4, this.y + this.height / 2);
        canvas.context.lineTo(this.x + 25, this.y + this.height / 2);
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.moveTo(this.x + 25, this.y);
        canvas.context.lineTo(this.x + 25, this.y + this.height);
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.moveTo(this.x + 35, this.y + 7);
        canvas.context.lineTo(this.x + 35, this.y + this.height - 7);
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.moveTo(this.x + 45, this.y);
        canvas.context.lineTo(this.x + 45, this.y + this.height);
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.moveTo(this.x + 55, this.y + 7);
        canvas.context.lineTo(this.x + 55, this.y + this.height - 7);
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.moveTo(this.x + 55, this.y + this.height / 2);
        canvas.context.lineTo(this.x + this.width - 4, this.y + this.height / 2);
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.font = "12px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText(name, this.x + this.width / 2 - 4, this.y + this.height / 2 + 30);

        this.A.draw();
        this.B.draw();
    };
    this.isInside = function () {

    }
};

var Resistor = function (x, y, name) {
    this.width = 60;
    this.height = 10;
    this.x = x - (this.width - 20) / 2;
    this.y = y - this.height / 2;

    this.R = 8*Math.pow(10,6);
    this.name = name;
    this.A = new point(canvas.id, null, this.x - 20, this.y + this.height / 2, 4, pointType.PASSIVE, "A", this);
    this.B = new point(canvas.id, null, this.x + 60, this.y + this.height / 2, 4, pointType.PASSIVE, "B", this);

    this.draw = function () {
        canvas.context.beginPath();
        canvas.context.rect(this.x, this.y, this.width - 20, this.height);
        canvas.context.lineWidth = "1";
        canvas.context.strokeStyle = "black";
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.moveTo(this.x + 40, this.y + this.height / 2);
        canvas.context.lineTo(this.x + 60, this.y + this.height / 2);
        canvas.context.lineWidth = 2;
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.beginPath();
        canvas.context.moveTo(this.x, this.y + this.height / 2);
        canvas.context.lineTo(this.x - 20, this.y + this.height / 2);
        canvas.context.lineWidth = "2";
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.font = "12px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText(name, this.x + this.width / 2 - 4, this.y + this.height / 2 + 30);

        this.A.draw();
        this.B.draw();
    }
    this.isInside = function () {
        return false;
    }
};

var Galvanometer = function (x, y, name) {
    this.width = 90;
    this.height = 30;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.value = "0.00";
    this.maxValue = 60;
    this.minValue = -60;
    this.A = new point(canvas.id, null, this.x + 3, this.y + this.height / 2, 4, pointType.PASSIVE, "A", this);
    this.B = new point(canvas.id, null, this.x + this.width - 3, this.y + this.height / 2, 4, pointType.PASSIVE, "B", this);
    this.A.V = 0;
    this.B.V = 0;
    this.name = name;
    this.draw = function () {

        canvas.context.beginPath();
        canvas.context.rect(this.x + 7.5, this.y, this.width - 15, this.height);
        canvas.context.lineWidth = "1";
        canvas.context.strokeStyle = "black";
        canvas.context.fillStyle = "#CFD2CF";
        canvas.context.fillRect(this.x + 7.5, this.y, this.width - 15, this.height);
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.font = "24px digitalFont";
        canvas.context.fillStyle = "grey";
        canvas.context.fillText(this.value, this.x + this.width / 2 - 24, this.y + this.height / 2 + 9);

        canvas.context.font = "12px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText(name, this.x + this.width / 2 - 4, this.y + this.height / 2 + 30);

        this.A.draw();
        this.B.draw();
        //this.update();
    }
    this.isInside = function () {

    }
    this.update = function (value) {
        //let value = this.A.V - this.B.V;
        this.value = parseFloat(value).toFixed(2);
        canvas.draw();
    }
    this.operate = function () {
        this.update();
    }
};

var Potentiometer = function (x, y, name) {
    this.width = 10;
    this.height = 10;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.A = new point(canvas.id, null, this.x + 40, this.y + 25, 4, pointType.PASSIVE, "A", this);
    this.O = new point(canvas.id, null, this.x + 10, this.y + 10, 4, pointType.ACTIVE_PASSIVE, "O", this);
    this.B = new point(canvas.id, null, this.x + 10, this.y + 40, 4, pointType.PASSIVE, "B", this);
    this.name = name;
    this.draw = function () {
        canvas.context.font = "12px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText(name, this.x + this.width / 2 - 4, this.y + this.height / 2 + 30);
        this.A.draw();
        this.O.draw();
        this.B.draw();
    };
    this.isInside = function () {

    }
};

var Condenser = function (x, y, name) {
    this.width = 30;
    this.height = 30;
    this.x = x - this.width / 2;
    this.y = y - this.height / 2;
    this.r = 25;

    this.R = .2;
    this.C = .8*Math.pow(10,-6);
    this.V = 0;
    this.Vtemp = 0;

    this.A = new point(canvas.id, null, this.x, this.y + this.height / 2, 4, pointType.ACTIVE_PASSIVE, "A", this);
    this.B = new point(canvas.id, null, this.x + 28, this.y + this.height / 2, 4, pointType.ACTIVE_PASSIVE, "B", this);
    this.name = name;
    this.draw = function () {
        canvas.context.beginPath();
        canvas.context.arc(this.x + this.width / 2, this.y + this.height / 2, this.r, 0, 2 * Math.PI);
        canvas.context.lineWidth = "2";
        canvas.context.strokeStyle = "black";
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.font = "12px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText(name, this.x + this.width / 2 - 4, this.y + this.height / 2 + 30);

        this.A.draw();
        this.B.draw();
    }
    this.isInside = function () {

    }
    this.charge = function (Vs, t, R) {
        //Ilet Vs = this.A.V - this.B.V;
        this.Vtemp = Vs * (1 - Math.pow(2.7183, -(t / ((this.R + R) * this.C))));
        this.Vtemp = this.Vtemp > canvas.battery.V ? canvas.battery.V : this.Vtemp;
    }
    this.discharge = function (t, R) {
        this.V = this.V * Math.pow(2.7183, -(t / ((this.R + R) * this.C)));
        this.V = this.V < 0 ? 0 : this.V;
        //console.log(this.V);
    }
    this.update = function (flag) {
        this.V = this.V + this.Vtemp;
        this.V = this.V > canvas.battery.V ? canvas.battery.V : this.V;
        this.V = this.V < 0 ? 0 : this.V;
        this.Vtemp = 0;
    }
};

var Canvas = function (id) {
    this.id = id;
    this.obj = document.getElementById(this.id);
    this.parent = this.obj.parentElement;
    this.width = 500;//this.parent.clientWidth;
    this.height = 450;//this.parent.clientHeight;
    this.obj.setAttribute("width", this.width);
    this.obj.setAttribute("height", this.height);
    this.context = this.obj.getContext('2d');
    this.element = [];
    this.connection = [];
    this.redoArray = [];
    this.action = null;
    this.currentElement = null;
    this.timeInterval = null;
    this.battery = null;

    this.draw = function () {
        this.context.clearRect(0, 0, canvas.width, canvas.height);
        var img = new Image();
        img.src = "images/exam-circuit.png";
        canvas.context.drawImage(img,380,3,120,90);
        document.getElementsByTagName("body")[0].style.cursor = "default";
        for (let ele in this.element) {
            this.element[ele].draw();
        }
        for (var con in this.connection) {
            this.connection[con].draw();
        }
        //if(canvas.isDraw)
        canvas.stopWatch.draw();
    }
    this.reset = function () {
        this.element = [];
        this.connection = [];
        canvas.element.push(new point(canvas.id, null, 220, 300, 8, pointType.PASSIVE, "Z", null));
        this.draw();
        terminal.update("Reset Done..");
    }
    this.undo = function () {
        if (canvas.element.length > 0) {
            if (!(canvas.element[canvas.element.length - 1] instanceof point)) {
                canvas.redoArray.push(canvas.element.pop());
                canvas.draw();
                terminal.update("Undo Done..");
            }
        }
    }
    this.redo = function () {
        if (canvas.redoArray.length > 0) {
            canvas.element.push(canvas.redoArray.pop());
            canvas.draw();
            terminal.update("Redo Done..");
        }
    }

    this.start = function () {

        if (this.isCorrect() && canvas.element.length == 21) {
            for (let i = 0; i < buttons.length; i++) {
                if (operationType[buttons[i].getAttribute("vlab-action")] == operationType.STOP_SIMULATION) {
                    buttons[i].classList.remove("disabled");
                    buttons[i].removeAttribute("disabled");
                    continue;
                }
                buttons[i].classList.add("disabled");
                buttons[i].setAttribute("disabled", "true");
            }

            for (let i = 0; i < startedButtons.length; i++) {
                startedButtons[i].classList.remove("disabled");
                startedButtons[i].removeAttribute("disabled");
            }

            //this.timeInterval = setInterval(this.run, 500);
            canvas.stopWatch.isDraw = true;
            terminal.update("Simulation Started");
            this.action = operationType.START_SIMULATION;
        } else {
            terminal.update("Circuit Not Completed.");
        }
    }
    this.stop = function () {
        //if (canvas.action == operationType.START_SIMULATION) {
        for (let i = 0; i < buttons.length; i++) {
            if (operationType[buttons[i].getAttribute("vlab-action")] == operationType.STOP_SIMULATION) {
                buttons[i].classList.add("disabled");
                buttons[i].setAttribute("disabled", "true");
                continue;
            }
            buttons[i].classList.remove("disabled");
            buttons[i].removeAttribute("disabled");
        }
        terminal.update("Simulation Stopped");
        clearInterval(this.timeInterval);
        canvas.stopWatch.isDraw = false;
        this.timeInterval = null;
        for (let i = 0; i < startedButtons.length; i++) {
            startedButtons[i].classList.add("disabled");
            startedButtons[i].setAttribute("disabled", "true");
        }
        //}
    }

    this.run = function () {
        if (canvas.twoWayKey.output == canvas.twoWayKey.outputA) {
            //k0 A
            if (canvas.tapKey_3.output == canvas.tapKey_3.outputA) {
                // canvas.stopWatch.stop();
                //K3 A
                if (canvas.tapKey_2.output == canvas.tapKey_2.outputA) {
                    //K2 A
                    canvas.condenser.V = 0;
                    canvas.galvanometer.update(canvas.condenser.V);
                } else {
                    //K2 B
                    canvas.stopWatch.stop();
                    canvas.condenser.update();
                    canvas.galvanometer.update(canvas.condenser.V);
                }
            } else {
                //K3 B
                if (canvas.tapKey_1.output == canvas.tapKey_1.outputA) {
                    //K1 A
                    canvas.stopWatch.reStart();
                    canvas.condenser.discharge(canvas.stopWatch.s, canvas.resistor.R);
                    //discharge through leakage resistor timer start
                } else {
                    //K1 B
                    //discharge through leakage resistor

                    if (canvas.tapKey_2.output == canvas.tapKey_2.outputA) {

                    } else {
                        canvas.stopWatch.stop();
                        canvas.condenser.update();
                    }
                }
            }
        } else {
            //K0 B
            if (canvas.tapKey_1.output == canvas.tapKey_1.outputA) {
                //K1 A
                //charge with leakage resistor
                canvas.stopWatch.reStart();
                canvas.condenser.charge(canvas.battery.V, canvas.stopWatch.s, canvas.resistor.R);

            } else {
                //K1 B
                canvas.stopWatch.reStart();
                canvas.condenser.charge(canvas.battery.V, canvas.stopWatch.s, 0);
            }
        }
    }

    this.isCorrect = function () {
        var count = 0;
        var flag = true;
        for (let i = 0; i < canvas.element.length; i++) {
            if (canvas.element[i] instanceof Wire) {
                count++;
                flag = flag && canvas.element[i].flag;
            }
        }
        return ((count == 12) && flag);
    }
    this.onResize = function () {
        canvas.width = canvas.parent.clientWidth;
        canvas.height = canvas.parent.clientHeight;
        canvas.obj.setAttribute("width", canvas.width);
        canvas.obj.setAttribute("height", canvas.height);
    }
};

var StopWatch = function (x, y) {
    this.width = 50;
    this.height = 20;
    this.x = x;
    this.y = y;
    this.s = 0;
    this.ms = 0;
    this.isStart = false;
    this.isDraw = false;
    this.time = null;
    this.timeInterval = null;
    this.draw = function () {
        if (this.s % 2 == 0)
            this.time = (this.s < 10 ? "0" + this.s : this.s) + ":" + (this.ms < 10 ? "0" + this.ms : this.ms);
        else
            this.time = (this.s < 10 ? "0" + this.s : this.s) + " " + (this.ms < 10 ? "0" + this.ms : this.ms);

        canvas.context.beginPath();

        canvas.context.fillStyle = "#bbb";
        canvas.context.fillRect(this.x - 120, this.y - 20, 200, 70);
        canvas.context.fillStyle = "black";

        canvas.context.lineWidth = "4";
        canvas.context.rect(this.x - 120, this.y - 20, 200, 70);
        canvas.context.strokeStyle = "black";
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.clearRect(this.x, this.y, this.width, this.height);
        canvas.context.beginPath();
        // canvas.context.rect(this.x, this.y, this.width, this.height);
        // canvas.context.strokeStyle = "black";

        canvas.context.fillStyle = "#CFD2CF";
        canvas.context.fillRect(this.x, this.y, this.width, this.height);
        canvas.context.lineWidth = 2;
        canvas.context.stroke();
        canvas.context.closePath();

        canvas.context.font = "20px digitalFont";
        canvas.context.fillStyle = "black";
        canvas.context.fillText(this.time, this.x + this.width / 2 - 22.5, this.y + this.height / 2 + 5.5);

        canvas.context.font = "15px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText("Stopwatch :", this.x + this.width / 2 - 120, this.y + this.height / 2 + 2.5);

        canvas.context.font = "15px Arial";
        canvas.context.fillStyle = "black";
        canvas.context.fillText("SS:MS", this.x + this.width / 2 - 22.5, this.y + this.height / 2 + 26);
    }
    this.reset = function () {
        this.ms = 0;
        this.s = 0;
    }
    this.start = function () {
        if (!this.isStart) {
            this.isStart = true;
            this.timeInterval = setInterval(this.operate, 10);
        } else {
            terminal.update("Stopwatch is already running.");
        }
    }
    this.stop = function () {
        if (this.isStart) {
            this.isStart = false;
            clearInterval(this.timeInterval);
        }
    }
    this.reStart = function () {
        if (!this.isStart) {
            this.reset();
            this.start();
        }
    }
    this.operate = function () {
        canvas.stopWatch.ms += 1;
        if (canvas.stopWatch.ms == 100) {
            canvas.stopWatch.s++;
            canvas.stopWatch.ms = 0;
            if (canvas.stopWatch.s == 60) {
                canvas.stopWatch.s = 0;
            }
        }
        canvas.stopWatch.draw();
    }
}

window.onload = function () {
    window.terminal = new Terminal();
    window.canvas = new this.Canvas("myCanvas");
    window.buttons = this.document.getElementsByClassName("stopped");
    window.startedButtons = this.document.getElementsByClassName("started");

    window.charging = this.document.getElementById("charging");
    window.read = this.document.getElementById("read");
    window.discharging = this.document.getElementById("discharging");
    window.discharge = this.document.getElementById("discharge");

    canvas.stopWatch = new this.StopWatch(130, 30);
    canvas.stop();
    this.createTable();
    this.document.addEventListener("mousedown", function (e) {
        var tempPos = getMousePos(window.canvas.obj, e);
        update(tempPos.x, tempPos.y);
        if (typeof mouseLeftDown === "function") {
            if (e.button == 0)
                mouseLeftDown(tempPos.x, tempPos.y);
        }
    }, false);

    this.document.addEventListener("mousemove", function (e) {
        var tempPos = getMousePos(window.canvas.obj, e);
        update(tempPos.x, tempPos.y);
        if (typeof mouseMove === "function") {
            mouseMove(tempPos.x, tempPos.y);
        }
    }, false);

    //attach Listener
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", function (e) {
            var vlab_action = e.target.getAttribute("vlab-action");
            vlab_action = operationType[vlab_action];
            switch (vlab_action) {
                case operationType.DRAW_POINT:
                    canvas.action = operationType.DRAW_POINT;
                    break;
                case operationType.DRAW_POTENTIOMETER:
                    canvas.action = operationType.DRAW_POTENTIOMETER;
                    break;
                case operationType.DRAW_RESISTOR:
                    canvas.action = operationType.DRAW_RESISTOR;
                    break;
                case operationType.DRAW_TAPKEY:
                    canvas.action = operationType.DRAW_TAPKEY;
                    break;
                case operationType.DRAW_CELL:
                    canvas.action = operationType.DRAW_CELL;
                    break;
                case operationType.DRAW_GALVANOMETER:
                    canvas.action = operationType.DRAW_GALVANOMETER;
                    break;
                case operationType.DRAW_TWO_WAY_KEY:
                    canvas.action = operationType.DRAW_TWO_WAY_KEY;
                    break;
                case operationType.DRAW_CONDENSER:
                    canvas.action = operationType.DRAW_CONDENSER;
                    break;
                case operationType.MAKE_CONNECTION:
                    canvas.action = operationType.MAKE_CONNECTION;
                    break;
                case operationType.START_SIMULATION:
                    canvas.start();
                    break;
                case operationType.STOP_SIMULATION:
                    canvas.action = operationType.STOP_SIMULATION;
                    canvas.stop();
                    break;
                case operationType.RESET:
                    canvas.action != operationType.START_SIMULATION ? canvas.reset() : "";
                    break;
                case operationType.UNDO:
                    canvas.action != operationType.START_SIMULATION ? canvas.undo() : "";
                    break;
                case operationType.REDO:
                    canvas.action != operationType.START_SIMULATION ? canvas.redo() : "";
                    break;
                default:
                    break;
            }
        }, false);
    }
    document.getElementById("draw-graph").addEventListener("click", function () {
        drawGraph();
    }, false);
    window.onkeypress = function (e) {
        switch (e.keyCode) {
            case 25:
                canvas.action != operationType.START_SIMULATION ? canvas.redo() : "";
                break;
            case 26:
                canvas.action != operationType.START_SIMULATION ? canvas.undo() : "";
                break;
            default:
                break;
        }
    }

    //draw all component already
    // for (let i = 0; i < 8; i++) {
    //     if (i == 5)
    //         continue;
    //     canvas.action = i;
    //     this.mouseLeftDown(3, 3);
    //     //canvas.action = this.operationType[i]
    // }

    this.init();

    document.getElementsByClassName("loader")[0].style.display = "none";
    canvas.element.push(new point(canvas.id, null, 80, 300, 8, pointType.PASSIVE, "Z", null));
    canvas.draw();
    this.drawGraph();
};

window.onresize = function () {
    //canvas.onResize();
    //canvas.draw();
}

function mouseLeftDown(x, y) {
    if (x > 0 && y > 0) {
        if (canvas.action == operationType.DRAW_POINT) {
            //canvas.element.push(new point(canvas.id, null, 220, 300, 8, pointType.PASSIVE, ""));
            //canvas.redoArray = [];
        } else if (canvas.action == operationType.MAKE_CONNECTION) {
            drawConnection(x, y, canvas.currentElement);
            canvas.redoArray = [];
        } else if (canvas.action == operationType.DRAW_TWO_WAY_KEY) {
            if (!checkInstance(TwoWayKey)) {
                canvas.twoWayKey = new TwoWayKey(440, 301, "K0");
                canvas.element.push(canvas.twoWayKey);
                canvas.redoArray = [];
            }
        } else if (canvas.action == operationType.DRAW_CELL) {
            if (!checkInstance(Cell)) {
                canvas.battery = new Cell(248, 400, "B");
                canvas.element.push(canvas.battery);
                canvas.redoArray = [];
            }
        } else if (canvas.action == operationType.DRAW_RESISTOR) {
            if (!checkInstance(Resistor)) {
                canvas.resistor = new Resistor(248, 350, "R");
                canvas.element.push(canvas.resistor);
                canvas.redoArray = [];
            }
        } else if (canvas.action == operationType.DRAW_GALVANOMETER) {
            if (!checkInstance(Galvanometer)) {
                canvas.galvanometer = new Galvanometer(248, 150, "G");
                canvas.element.push(canvas.galvanometer);
                canvas.redoArray = [];
            }
        } else if (canvas.action == operationType.DRAW_POTENTIOMETER) {
            if (!checkInstance(Potentiometer)) {
                canvas.potentiometer = new Potentiometer(x, y, "P")
                canvas.element.push(canvas.potentiometer);
                canvas.redoArray = [];
            }
        } else if (canvas.action == operationType.DRAW_TAPKEY) {
            if (!checkInstance(TapKey)) {
                canvas.tapKey_1 = new TapKey(348, 365, "K1");
                canvas.tapKey_2 = new TapKey(248, 217, "K2");
                canvas.tapKey_3 = new TapKey(350, 150, "K3");
                canvas.element.push(canvas.tapKey_1);
                canvas.element.push(canvas.tapKey_2);
                canvas.element.push(canvas.tapKey_3);
                canvas.redoArray = [];
            }
        }
        else if (canvas.action == operationType.DRAW_CONDENSER) {
            if (!checkInstance(Condenser)) {
                canvas.condenser = new Condenser(248, 300, "C");
                canvas.element.push(canvas.condenser);
                canvas.redoArray = [];
            }
        }

        // if (canvas.action == operationType.START_SIMULATION) {
        //     if (canvas.currentElement instanceof TwoWayKey) {
        //         canvas.currentElement.click();
        //     } else if (canvas.currentElement instanceof TapKey) {
        //         canvas.currentElement.click();
        //     }
        // }
    }
    console.log(canvas.element);
    canvas.draw();
    hover(x, y);
}

function mouseMove(x, y) {
    hover(x, y)
}

function hover(x, y) {
    for (var ele in canvas.element) {
        if (canvas.element[ele] instanceof point) {
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        } else if (canvas.element[ele] instanceof TwoWayKey) {
            if (canvas.element[ele].input.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].input;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].outputA.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].outputA;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].outputB.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].outputB;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                document.getElementsByTagName("body")[0].style.cursor = "pointer";
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        } else if (canvas.element[ele] instanceof Resistor) {
            if (canvas.element[ele].A.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].A;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].B.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].B;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                document.getElementsByTagName("body")[0].style.cursor = "pointer";
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        } else if (canvas.element[ele] instanceof Cell) {
            if (canvas.element[ele].A.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].A;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].B.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].B;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                document.getElementsByTagName("body")[0].style.cursor = "pointer";
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        } else if (canvas.element[ele] instanceof Galvanometer) {
            if (canvas.element[ele].A.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].A;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].B.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].B;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                document.getElementsByTagName("body")[0].style.cursor = "pointer";
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        } else if (canvas.element[ele] instanceof Potentiometer) {
            if (canvas.element[ele].A.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].A;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].O.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].O;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].B.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].B;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                document.getElementsByTagName("body")[0].style.cursor = "pointer";
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        } else if (canvas.element[ele] instanceof Condenser) {
            if (canvas.element[ele].A.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].A;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].B.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].B;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                document.getElementsByTagName("body")[0].style.cursor = "pointer";
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        } else if (canvas.element[ele] instanceof TapKey) {
            if (canvas.element[ele].input.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].input;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else if (canvas.element[ele].outputA.isInside(x, y)) {
                canvas.currentElement = canvas.element[ele].outputA;
                poinHoverCircle(canvas.currentElement.point.x, canvas.currentElement.point.y, 3);
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
            if (canvas.element[ele].isInside(x, y)) {
                canvas.currentElement = canvas.element[ele];
                document.getElementsByTagName("body")[0].style.cursor = "pointer";
                break;
            } else {
                canvas.draw();
                canvas.currentElement = null;
            }
        }
    }
}

function checkInstance(name) {
    for (let i = 0; i < canvas.element.length; i++) {
        if (canvas.element[i] instanceof name) {
            return true;
        }
    }
    return false;
}

function drawConnection(x, y, ele) {
    if (canvas.action != operationType.START_SIMULATION) {
        if (!(ele instanceof point)) {
            return;
        }
        if (preCon == null) {
            preCon = ele;
        } else if (preCon != ele && ((preCon.device != null && ele.device != null) ? (preCon.device.name != ele.device.name) : 1)) {
            var temp = new Wire(preCon, ele, true);
            canvas.element.push(temp);
            preCon.connection.push(temp);
            ele.connection.push(temp);
            preCon = null;
        }
    }
}

function poinHoverCircle(x, y, r) {
    canvas.context.beginPath();
    canvas.context.arc(x, y, r, 0, 2 * Math.PI);
    canvas.context.strokeStyle = "lightblue";
    canvas.context.stroke();
    canvas.context.closePath();
    document.getElementsByTagName("body")[0].style.cursor = "pointer";
}

function init() {
    window.charging.addEventListener("click", function (e) {
        if (operationType[e.target.getAttribute("vlab-action")] == operationType.START_CHARGING) {
            e.target.setAttribute("vlab-action", "STOP_CHARGING");
            e.target.innerHTML = "Stop Capacitor Charging";
            e.target.classList.remove("btn-success");
            e.target.classList.add("btn-danger");
            window.read.classList.add("disabled");
            window.read.setAttribute("disabled", "true");
            window.discharging.classList.add("disabled");
            window.discharging.setAttribute("disabled", "true");
            window.discharge.classList.add("disabled");
            window.discharge.setAttribute("disabled", "true");

            canvas.stopWatch.reStart();
            canvas.twoWayKey.output = canvas.twoWayKey.outputB;
            canvas.tapKey_1.output = canvas.tapKey_1.outputB;
            canvas.tapKey_2.output = canvas.tapKey_2.outputB;
            canvas.tapKey_3.output = canvas.tapKey_3.outputB;
            canvas.draw();
        } else {
            e.target.setAttribute("vlab-action", "START_CHARGING");
            e.target.innerHTML = "Start Capacitor Charging";
            e.target.classList.remove("btn-danger");
            e.target.classList.add("btn-success");
            window.read.classList.remove("disabled");
            window.read.removeAttribute("disabled");
            window.discharging.classList.remove("disabled");
            window.discharging.removeAttribute("disabled");
            window.discharge.classList.remove("disabled");
            window.discharge.removeAttribute("disabled");

            canvas.stopWatch.stop();
            canvas.condenser.charge(canvas.battery.V, canvas.stopWatch.s, 0);
            canvas.condenser.update();
            canvas.twoWayKey.output = canvas.twoWayKey.outputA;
            canvas.draw();
        }
    }, false);
    window.read.addEventListener("click", function () {
        canvas.galvanometer.update(canvas.condenser.V);
        canvas.twoWayKey.output = canvas.twoWayKey.outputA;
        canvas.tapKey_1.output = canvas.tapKey_1.outputB;
        canvas.tapKey_2.output = canvas.tapKey_2.outputB;
        canvas.tapKey_3.output = canvas.tapKey_3.outputA;
        canvas.draw();
    }, false);
    window.discharging.addEventListener("click", function (e) {
        if (operationType[e.target.getAttribute("vlab-action")] == operationType.START_DISCHARGING) {
            e.target.setAttribute("vlab-action", "STOP_DISCHARGING");
            e.target.innerHTML = "Stop Capacitor Disharging";
            e.target.classList.remove("btn-success");
            e.target.classList.add("btn-danger");
            window.read.classList.add("disabled");
            window.read.setAttribute("disabled", "true");
            window.charging.classList.add("disabled");
            window.charging.setAttribute("disabled", "true");
            window.discharge.classList.add("disabled");
            window.discharge.setAttribute("disabled", "true");

            canvas.stopWatch.reStart();
            canvas.twoWayKey.output = canvas.twoWayKey.outputA;
            canvas.tapKey_1.output = canvas.tapKey_1.outputA;
            canvas.tapKey_2.output = canvas.tapKey_2.outputB;
            canvas.tapKey_3.output = canvas.tapKey_3.outputB;
            canvas.draw();
        } else {
            e.target.setAttribute("vlab-action", "START_DISCHARGING");
            e.target.innerHTML = "Start Capacitor Disharging";
            e.target.classList.remove("btn-danger");
            e.target.classList.add("btn-success");
            window.read.classList.remove("disabled");
            window.read.removeAttribute("disabled");
            window.charging.classList.remove("disabled");
            window.charging.removeAttribute("disabled");
            window.discharge.classList.remove("disabled");
            window.discharge.removeAttribute("disabled");

            canvas.stopWatch.stop();
            canvas.condenser.discharge(canvas.stopWatch.s, canvas.resistor.R);
            canvas.tapKey_1.output = canvas.tapKey_1.outputB;
            canvas.draw();
        }
    }, false);
    window.discharge.addEventListener("click", function () {
        canvas.condenser.V = 0;
        canvas.twoWayKey.output = canvas.twoWayKey.outputA;
        canvas.tapKey_1.output = canvas.tapKey_1.outputB;
        canvas.tapKey_2.output = canvas.tapKey_2.outputA;
        canvas.tapKey_3.output = canvas.tapKey_3.outputA;
        canvas.galvanometer.update(canvas.condenser.V);
        canvas.draw();
    }, false);
}

function createTable() {
    var str = "<h3 class='text-center'>Datatable</h3>";
    str += "<table>";
    str += "<tr><th>Sr No.</th><th>First Deflection<br>(&theta;<sub>0</sub>)</th><th>Time (t)<br>(s)</th><th>Deflection After Discharging<br>(&theta;<sub>t</sub>)<br> </th><th>(&theta;<sub>0</sub>/&theta;<sub>t</sub>)</th><th>log<sub>10</sub>(&theta;<sub>0</sub>/&theta;<sub>t</sub>)</th></tr>";
    var table = document.getElementById("dataTable");
    for (i = 1; i <= 4; i++) {
        str += '<tr><td>' + i + '.</td><td id = "d' + i + '1"><input type="text"></td><td id = "d' + i + '2"><input type="text"></td><td id = "d' + i + '3"><input type="text"></td><td id = "d' + i + '4"><input type="text"></td><td id = "d' + i + '5"><input type="text"></td></tr>';
    }
    str += "</table>";
    table.innerHTML = str;
}

function drawGraph() {

    var datapoints1 = [];
    for (let i = 1; i <= 4; i++) {
        var tx = document.getElementById("d" + i + "2").firstChild.value;
        var ty = document.getElementById("d" + i + "5").firstChild.value;
        datapoints1.push({ x: parseInt(tx), y: parseInt(ty) });
        graphline("l1", datapoints1, "Time(t-s)", "log(θ0/θt)");
    }
}

function varify(e) {
    var res = parseFloat(document.getElementById("result").value);
    var perError = 100 * (canvas.resistor.R - res) / canvas.resistor.R;
    alert("Percentage Error : "+perError+"%");
    terminal.update("Percentage Error : "+perError+"%");
}