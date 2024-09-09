let floorCount = 0;
let liftCount = 0;

let floors = [];
let lifts = [];

let liftQueue = [];

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

function restartGame() {
  floorCount = 0;
  liftCount = 0;
  liftQueue = [];
  floors = [];
  lifts = [];
  floorsInput.value = '';
  liftsInput.value = '';
  error.classList.add('hideError');
  errorMsg.innerHTML = '';
  buildingArea.innerHTML = '';
  liftQueueArea.innerHTML = '';
}

function validateForm() {
  let validationResult = {
    isValid: true,
    errorMessage: '',
  };
  if (floorCount === 0 || liftCount === 0) {
    validationResult.isValid = false;
    validationResult.errorMessage = 'Lift or Floor values cannot be 0';
  } else if (isNaN(floorCount) || isNaN(liftCount)) {
    validationResult.isValid = false;
    validationResult.errorMessage = 'Lift or Floor values must be numbers';
  } else if (floorCount < 0 || liftCount < 0) {
    validationResult.isValid = false;
    validationResult.errorMessage = 'Lift or Floor values cannot be negative';
  } else if (floorCount <= liftCount) {
    validationResult.isValid = false;
    validationResult.errorMessage =
      'Lifts cannot be more than or equal to floors';
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
    initializeBuildingArea();
  }
}

function initializeBuildingArea() {
  for (let i = floorCount; i > 0; i--) {
    createFloor(i);
  }

  for (let i = 0; i < liftCount; i++) {
    const lift = createLift(i);
    groundFloorLiftArea.appendChild(lift);
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
  const lift = document.createElement('div');
  lift.classList.add('lift');
  lift.id = `lift${index}`;

  const liftLeftDoor = document.createElement('div');
  const liftRightDoor = document.createElement('div');
  liftLeftDoor.classList.add('lift-doors', 'lift-left-door');
  liftRightDoor.classList.add('lift-doors', 'lift-right-door');
  lift.appendChild(liftLeftDoor);
  lift.appendChild(liftRightDoor);

  lifts.push({
    lift,
    currentFloor: 1,
    targetFloor: null,
    status: 'idle',
    direction: null,
    doorsOpen: false,
  });

  return lift;
}

function handleLiftCall(event) {
  const button = event.target;
  const floorNumber = Number(button.getAttribute('floor-number'));
  const callDirection = button.getAttribute('call-direction');

  button.disabled = true;

  const liftAtFloor = lifts.find(
    (lift) => lift.currentFloor === floorNumber && lift.status === 'idle'
  );

  if (liftAtFloor) {
    openLiftDoors(liftAtFloor);

    setTimeout(() => {
      closeLiftDoors(liftAtFloor);

      button.disabled = false;
      checkLiftQueue();
    }, 2500);
  } else {
    const liftCall = { floorNumber, callDirection, button };
    liftQueue.push(liftCall);
    updateLiftQueueDisplay();
    checkLiftQueue();
  }
}

function updateLiftQueueDisplay() {
  liftQueueArea.innerHTML = liftQueue
    .map((call) => `Floor ${call.floorNumber} (${call.callDirection})`)
    .join(', ');
}

function findNearestAvailableLift(targetFloor) {
  let nearestLift = null;
  let shortestDistance = Infinity;

  for (let i = 0; i < lifts.length; i++) {
    const lift = lifts[i];
    if (lift.status === 'idle') {
      const distance = Math.abs(lift.currentFloor - targetFloor);
      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestLift = lift;
      }
    }
  }

  return nearestLift;
}

function moveLift(lift, targetFloor, button) {
  if (lift.currentFloor === targetFloor) {
    arrivedAtFloor(lift, targetFloor, button);
    return;
  }

  lift.status = 'moving';
  lift.targetFloor = targetFloor;
  lift.direction = targetFloor > lift.currentFloor ? 'up' : 'down';

  const distance = Math.abs(targetFloor - lift.currentFloor);
  const duration = distance * 2000;

  lift.lift.style.transition = `transform ${duration}ms linear`;
  lift.lift.style.transform = `translateY(-${(targetFloor - 1) * 100}px)`;

  setTimeout(() => {
    arrivedAtFloor(lift, targetFloor, button);
  }, duration);
}

function arrivedAtFloor(lift, floorNumber, button) {
  lift.currentFloor = floorNumber;
  lift.status = 'door-opening';
  openLiftDoors(lift);

  setTimeout(() => {
    closeLiftDoors(lift);

    if (button) {
      button.disabled = false;
    }
    checkLiftQueue();
  }, 2500);
}

function openLiftDoors(lift) {
  if (lift.doorsOpen) return;

  const leftDoor = lift.lift.querySelector('.lift-left-door');
  const rightDoor = lift.lift.querySelector('.lift-right-door');

  leftDoor.style.transform = 'translateX(-100%)';
  rightDoor.style.transform = 'translateX(100%)';

  lift.doorsOpen = true;
}

function closeLiftDoors(lift) {
  if (!lift.doorsOpen) return;

  const leftDoor = lift.lift.querySelector('.lift-left-door');
  const rightDoor = lift.lift.querySelector('.lift-right-door');

  leftDoor.style.transform = 'translateX(0)';
  rightDoor.style.transform = 'translateX(0)';

  setTimeout(() => {
    lift.status = 'idle';
    lift.direction = null;
    lift.doorsOpen = false;
    checkLiftQueue();
  }, 2500);
}

function checkLiftQueue() {
  if (liftQueue.length > 0) {
    const nextCall = liftQueue.shift();
    updateLiftQueueDisplay();

    const availableLift = findNearestAvailableLift(nextCall.floorNumber);
    if (availableLift) {
      moveLift(availableLift, nextCall.floorNumber, nextCall.button);
    } else {
      liftQueue.unshift(nextCall);
    }
  }
}
