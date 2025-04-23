<script setup lang="ts">
import {$api} from "src/utils/api";

const testStore = useTestStore()
const { increment, decrement } = testStore

const name = ref('');
const email = ref('');
const designation = ref('');
const notes = ref('');
const experiences = ref('');
const education = ref('');
const isOnProfilePage = ref(false);
const route = useRoute();

onMounted(async () => {
  console.log('onMounted');

  window.addEventListener("message", (event) => {
    if (event.data.type === "NAME_RESULT") {
      name.value =  event.data.element;
    }

    if (event.data.type === "DESIGNATION_RESULT") {
      designation.value =  event.data.element;
    }
    
    if(event.data.type === "EXPERIENCE_RESULT") {
      experiences.value = event.data.element;
    }

    if(event.data.type === "SET_PAGE") {
      isOnProfilePage.value = event.data.isOnProfilePage;
    }
  });

  setTimeout(() => {
    getName();
    getDesignation();
    getExperiences();
    checkIfAtProfilePage();
  }, 1000)
  
  
  await getPosition();
})

const getName = () => {
  window.parent.postMessage({ type: "GET_LINKEDIN_NAME", selector: ".artdeco-hoverable-trigger" }, "*");
}

const getExperiences = () => {
  window.parent.postMessage({ type: "GET_LINKEDIN_EXPERIENCE", selector: ".artdeco-card.pv-profile-card" }, "*");
}

const getDesignation = () => {
  window.parent.postMessage({ type: "GET_LINKEDIN_DESIGNATION", selector: "" }, "*");
}

const getPosition = async () => {
  var res = await $api(`/api/position/get-all-position`, { method: 'GET' });
  console.log('positions: ', res);
}

const sendToHive = () => {
  console.log('sendToHive...');
}

const checkIfAtProfilePage = () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(
          tabs[0].id,
          { type: "CHECK_IF_ON_PROFILE_PAGE" },
          (response: { isOnProfilePage?: boolean }) => {
            if (response?.isOnProfilePage) {
              isOnProfilePage.value = true;
            }
          }
      );
    }
  });
}

</script>

<template>
  <div class="container" v-if="!isOnProfilePage">
    <div class="flex justify-center">
      <div id="loading" style="align-items: center; justify-content: center; display: flex; flex-direction: column; height: 450px;">
        <div class="bee">
          <div class="body">
            <div class="line"></div>
          </div>
          <div>
            <div class="wing-right"></div>
            <div class="wing-left"></div>
          </div>
        </div>
        <div style="margin-top: 16px; text-align: center;">
          Searching for user profile...
        </div>
      </div>
    </div>
  </div>
  <div v-if="isOnProfilePage">
    <div class="text-left">
      <div>
        <div class="text-lg font-semibold mb-4">Name</div>
        <input
          v-model="name"
          type="text"
          class="input input-primary"
        />
      </div>
      <br />
      <div>
        <div class="text-lg font-semibold mb-4">Email</div>
        <input
            v-model="email"
            type="text"
            class="input input-primary"
        />
      </div>
      <br />
      <div>
        <div class="text-lg font-semibold mb-4">Designation</div>
        <input
            v-model="designation"
            type="text"
            class="input input-primary"
        />
      </div>
      <br />
      <div>
        <div class="text-lg font-semibold mb-4">Experiences</div>
        <textarea
          v-model="experiences"
          rows="5"
          class="input input-primary"
        />
      </div>
      <br />
      <div>
        <div class="text-lg font-semibold mb-4">Notes</div>
        <textarea
            v-model="notes"
            rows="5"
            class="input input-primary"
        />
      </div>
      <br />
      <div class="flex gap-2 justify-center">
        <button
          class="btn btn-primary"
          @click="sendToHive"
        >
          <i-ph-rocket-launch />
          Send to Hive
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>

.container {
  width: 100%;
  height: 100%;
  padding: 10px;
}

.bee {
  position: relative;
  align-self: center;
  width: 60px;
  height: 35px;
  -webkit-animation: to-fly 0.4s infinite;
  animation: to-fly 0.4s infinite;
}
.body {
  position: relative;
  width: 45px;
  height: 30px;
  border: 4px solid #fbc02d;
  background: #ffeb3b;
  border-radius: 20px;
  perspective: 2500px;
  z-index: 99;
}
.body:before,
.body:after {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
}
.body:before {
  right: 100%;
  top: 3px;
  border-top: 6px solid transparent;
  border-right: 13px solid #fbc02d;
  border-bottom: 6px solid transparent;
}
.body:after {
  right: 97%;
  top: 6px;
  border-top: 3px solid transparent;
  border-right: 6px solid #ffeb3b;
  border-bottom: 3px solid transparent;
}
.body .line {
  position: relative;
  left: 9px;
  height: 25px;
  width: 20px;
  background: #fbc02d;
}
.wing-right,
.wing-left {
  position: absolute;
  top: -20px;
  left: 12px;
  width: 20px;
  height: 25px;
  background: #ffeb3b;
  border: 4px solid #fbc02d;
  border-radius: 100%;
}
.wing-right {
  left: 15px;
  transform: skew(-20deg);
  -webkit-animation: wing-beat-right 0.25s infinite;
  animation: wing-beat-right 0.25s infinite;
  transform-origin: bottom;
  z-index: 9;
}
.wing-left {
  transform: skew(20deg);
  -webkit-animation: wing-beat-left 0.25s infinite;
  animation: wing-beat-left 0.25s infinite;
  transform-origin: bottom;
  z-index: 999;
}
@-webkit-keyframes to-fly {
  50% {
    transform: translateY(-3px);
  }
  100% {
    transform: translateY(0px);
  }
}
@keyframes to-fly {
  50% {
    transform: translateY(-3px);
  }
  100% {
    transform: translateY(0px);
  }
}
@-webkit-keyframes wing-beat-right {
  50% {
    transform: rotateX(60deg) skew(-20deg) rotateZ(25deg);
  }
  100% {
    transform: rotateX(0) skew(-20deg);
  }
}
@keyframes wing-beat-right {
  50% {
    transform: rotateX(60deg) skew(-20deg) rotateZ(25deg);
  }
  100% {
    transform: rotateX(0) skew(-20deg);
  }
}
@-webkit-keyframes wing-beat-left {
  50% {
    transform: rotateX(-65deg) skew(20deg) rotateZ(-10deg);
  }
  100% {
    transform: rotateX(0) skew(20deg);
  }
}
@keyframes wing-beat-left {
  50% {
    transform: rotateX(-65deg) skew(20deg) rotateZ(-10deg);
  }
  100% {
    transform: rotateX(0) skew(20deg);
  }
}
@-webkit-keyframes pollen {
  0% {
    left: -90px;
  }
  100% {
    left: -95px;
  }
}
@keyframes pollen {
  0% {
    left: -90px;
  }
  100% {
    left: -95px;
  }
}

textarea {
  height: 150px;
}
</style>
