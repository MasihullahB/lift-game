let floorCount = 0;
let liftCount = 0;

let floors = [];
let lifts = [];

let floorRequests = {};

const formInput = document.querySelector('.formInput');

const floorsInput = document.getElementById('floors');
const liftsInput = document.getElementById('lifts');

const error = document.querySelector('.error');
const errorMsg = document.getElementById('errorMsg');

let groundFloorLiftArea;

const btnStart = document.getElementById('btnStart');
const btnReset = document.getElementById('btnReset');
const buildingArea = document.querySelector('.building-area');
const liftQueueArea = document.querySelector('.lift-queue');

btnStart.addEventListener('click', startGame);
btnReset.addEventListener('click', restartGame);

document.querySelectorAll('.numberInput').forEach((input) => {
  input.addEventListener('input', (event) => {
    const value = event.target.value;
    if (!checkNumber(value)) {
      event.target.value = value.slice(0, -1);
      event.preventDefault();
    }
  });
});

function checkNumber(value) {
  return (
    (typeof value === 'number' && value - value === 0) ||
    (typeof value === 'string' &&
      Number.isFinite(+value) &&
      value.trim() !== '')
  );
}

function restartGame() {
  floorCount = 0;
  liftCount = 0;
  lifts = [];
  floors = [];
  floorRequests = {};
  floorsInput.value = '';
  liftsInput.value = '';
  error.classList.add('hideError');
  errorMsg.innerHTML = '';
  buildingArea.innerHTML = '';
  liftQueueArea.innerHTML = '';
  formInput.classList.remove('hideOnStart');
  buildingArea.classList.add('hideOnLoad');
}

function validateForm() {
  let validationResult = {
    isValid: true,
    errorMessage: '',
  };
  if (floorCount === 0 || liftCount === 0) {
    validationResult.isValid = false;
    validationResult.errorMessage = 'Lift or Floor values cannot be 0';
  } else if (floorCount < 0 || liftCount < 0) {
    validationResult.isValid = false;
    validationResult.errorMessage = 'Lift or Floor values cannot be negative';
  } else if (floorCount === 1 && liftCount > 0) {
    validationResult.isValid = false;
    validationResult.errorMessage = 'No lift required for 1 floor.';
  } else if (floorCount > 100 || liftCount > 100) {
    validationResult.isValid = false;
    validationResult.errorMessage =
      'Lift or Floor values cannot be more than 100';
  }

  return validationResult;
}

function startGame() {
  floorCount = Number(floorsInput.value);
  liftCount = Number(liftsInput.value);
  let validationResult = validateForm();
  if (!validationResult.isValid) {
    error.classList.remove('hideError');
    errorMsg.innerHTML = validationResult.errorMessage;
    buildingArea.innerHTML = '';
  } else {
    error.classList.add('hideError');
    errorMsg.innerHTML = '';
    formInput.classList.add('hideOnStart');
    buildingArea.classList.remove('hideOnLoad');
    initializeBuildingArea();
  }
}

function initializeBuildingArea() {
  for (let i = floorCount; i > 0; i--) {
    createFloor(i);
  }

  for (let i = 0; i < liftCount; i++) {
    const lift = createLift(i);
    groundFloorLiftArea.appendChild(lift.element);
  }
}

function createFloor(floorNumber) {
  const floor = document.createElement('div');
  floor.classList.add('floor');
  floor.id = `floor${floorNumber}`;

  const floorInfoSection = document.createElement('div');
  floorInfoSection.classList.add('floor-info-section');

  const floorLiftSection = document.createElement('div');
  floorLiftSection.classList.add('floor-lift-section');

  const floorLabel = document.createElement('p');
  floorLabel.classList.add('floor-label');
  floorLabel.innerHTML = `Floor ${floorNumber}`;

  floorInfoSection.appendChild(floorLabel);
  const liftButtons = createLiftButtons(floorNumber, floorInfoSection);

  floor.appendChild(floorInfoSection);
  floor.appendChild(floorLiftSection);

  floors.push({
    floorNumber,
    floorCount,
    floorInfoSection,
    liftButtons,
    floorLiftSection,
  });

  if (floorNumber === 1) groundFloorLiftArea = floorLiftSection;

  buildingArea.appendChild(floor);

  floorRequests[floorNumber] = { up: false, down: false };
}

function createLiftButtons(floorNumber, floorInfoSectionElement) {
  const liftButtons = document.createElement('div');
  liftButtons.classList.add('lift-buttons');
  const upButton = document.createElement('button');
  upButton.classList.add('up');
  upButton.innerHTML = '🔼';
  upButton.setAttribute('floor-number', floorNumber);
  upButton.setAttribute('call-direction', 'up');
  upButton.value = 'up';

  const downButton = document.createElement('button');
  downButton.classList.add('down');
  downButton.innerHTML = '🔽';
  downButton.setAttribute('floor-number', floorNumber);
  downButton.setAttribute('call-direction', 'down');
  downButton.value = 'down';

  if (floorNumber === 1) liftButtons.appendChild(upButton);
  else if (floorNumber === floorCount) liftButtons.appendChild(downButton);
  else {
    liftButtons.appendChild(upButton);
    liftButtons.appendChild(downButton);
  }

  floorInfoSectionElement.appendChild(liftButtons);

  upButton.addEventListener('click', handleLiftCall);
  downButton.addEventListener('click', handleLiftCall);

  return liftButtons;
}

function createLift(index) {
  const liftElement = document.createElement('div');
  liftElement.classList.add('lift');
  liftElement.id = `lift${index}`;

  const liftLeftDoor = document.createElement('div');
  const liftRightDoor = document.createElement('div');
  liftLeftDoor.classList.add('lift-doors', 'lift-left-door');
  liftRightDoor.classList.add('lift-doors', 'lift-right-door');
  liftElement.appendChild(liftLeftDoor);
  liftElement.appendChild(liftRightDoor);

  const liftObj = {
    element: liftElement,
    currentFloor: 1,
    isBusy: false,
    queue: [],
  };

  lifts.push(liftObj);

  return liftObj;
}

function handleLiftCall(event) {
  const button = event.target;
  const floorNumber = Number(button.getAttribute('floor-number'));
  const callDirection = button.getAttribute('call-direction');

  if (floorRequests[floorNumber][callDirection]) {
    console.log(
      `Request for ${callDirection} already active on floor ${floorNumber}`
    );
    return;
  }

  floorRequests[floorNumber][callDirection] = true;

  button.disabled = true;

  const liftCall = { floorNumber, callDirection, button };

  const closestLift = findClosestAvailableLift(floorNumber);
  if (closestLift) {
    closestLift.queue.push(liftCall);
    processLiftRequests(closestLift);
  } else {
    console.log(
      `No available lifts for ${callDirection} request at floor ${floorNumber}`
    );
  }
}

function findClosestAvailableLift(floorNumber) {
  let closestLift = null;
  let minDistance = Infinity;

  for (const lift of lifts) {
    if (!lift.isBusy) {
      const distance = Math.abs(lift.currentFloor - floorNumber);
      if (distance < minDistance) {
        minDistance = distance;
        closestLift = lift;
      }
    }
  }

  return closestLift;
}

function processLiftRequests(lift) {
  if (lift.isBusy || lift.queue.length === 0) return;

  lift.isBusy = true;
  const request = lift.queue.shift();
  moveLift(lift, request.floorNumber, request.callDirection, request.button);
}

function moveLift(lift, targetFloor, callDirection, button) {
  const distance = Math.abs(targetFloor - lift.currentFloor);
  const speedPerFloor = 2000;
  const totalTravelTime = distance * speedPerFloor;

  lift.element.style.transition = `transform ${totalTravelTime}ms linear`;
  lift.element.style.transform = `translateY(-${(targetFloor - 1) * 100}px)`;

  setTimeout(() => {
    lift.currentFloor = targetFloor;
    openLiftDoors(lift);

    if (button) {
      button.disabled = false;
    }

    floorRequests[targetFloor][callDirection] = false;

    setTimeout(() => {
      closeLiftDoors(lift);
      setTimeout(() => {
        lift.isBusy = false;
        processLiftRequests(lift);
      }, 2500);
    }, 2500);
  }, totalTravelTime);
}

function openLiftDoors(lift) {
  const leftDoor = lift.element.querySelector('.lift-left-door');
  const rightDoor = lift.element.querySelector('.lift-right-door');

  leftDoor.style.transform = 'translateX(-100%)';
  rightDoor.style.transform = 'translateX(100%)';
}

function closeLiftDoors(lift) {
  const leftDoor = lift.element.querySelector('.lift-left-door');
  const rightDoor = lift.element.querySelector('.lift-right-door');

  leftDoor.style.transform = 'translateX(0)';
  rightDoor.style.transform = 'translateX(0)';
}
