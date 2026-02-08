<script setup lang="ts">
import {$api} from "src/utils/api";

const testStore = useTestStore()
const { increment, decrement } = testStore

const name = ref('');
const email = ref('');
const phoneNumber = ref('');
const designation = ref('');
const notes = ref('');
const experiences = ref('');
const education = ref('');
const isOnProfilePage = ref(false);
const route = useRoute();
const isLoading = ref(false);
const isLoggedIn = ref(true);
const pollingInterval = ref<ReturnType<typeof setInterval> | null>(null);
const isSendingToHive = ref(false);
const isSucceeded = ref(false);
const url = import.meta.env.VITE_BASE_URL;
const candidateId = ref(0);
const photoUrl = ref('');

onMounted(async () => {
  console.log('onMounted panel..');
  try {
    let res = await $api(`/api/userApp/get-user-basic-info`, { method: 'GET' });
    isLoggedIn.value = true;
  } catch (error) {
    console.log('error: ', error);
    sendTabMessage("LOGIN", () => {});
  }
  
  window.addEventListener("message", async (event) => {
    console.log("component Panel got message:", event.data); 
    
    if(event.data.type === "SET_NAME") {  
      name.value = event.data.data.name;
      designation.value = event.data.data.designation;
      photoUrl.value = event.data.data.photoUrl || '';
    }
    
    if(event.data.type === "SET_CONTACT") {
      email.value = event.data.data.email;
      phoneNumber.value = event.data.data.phone;
    }
    
    if(event.data.type === "SET_EXPERIENCES") {
      experiences.value = event.data.data.map((e: any) => `${e.company}\n${e.title}\n${e.period}\n${e.description}`).join("\n\n");
    }
    
    if(event.data.type === "SET_EDUCATION") {
      education.value = event.data.data.map((e: any) => `${e.school}\n${e.degree}\n${e.years}`).join("\n\n");
    }

    if(event.data.type === "SET_PAGE") {
      isOnProfilePage.value = event.data.data;
    }

    if(event.data.type === "INIT") {
      setTimeout(() => checkIfAtProfilePage(), 1000);
    }
    
    if(event.data.type === "SET_LOGIN") {
      chrome.storage.local.get(['hiveAccessToken'], function(result) {
        if(result.hiveAccessToken){
          localStorage.setItem('hiveAccessToken', result.hiveAccessToken);
          isLoggedIn.value = true;
        }
      });
      checkIfAtProfilePage();
    }
    
  });

  checkIfAtProfilePage();
})

const getPosition = async () => {
  let res = await $api(`/api/position/get-all-position`, { method: 'GET' });
  console.log('positions: ', res);
}

const sendToHive = async () => {
  if(name.value === '') {
    alert('Please fill the name.');
    return;
  }
  if(email.value === '' && phoneNumber.value === '') {
    alert('Please fill the contact.');
    return;
  }
  isSendingToHive.value = true;
  console.log('sendToHive...');
  console.log('**data** ', name.value, experiences.value, education.value, notes.value, designation.value, email.value);
  let input = {
    name: name.value,
    experience: experiences.value,
    education: education.value,
    notes: notes.value,
    designation: designation.value,
    email: email.value,
    phoneNumber: phoneNumber.value,
    candidateProfilePicture: await getProfilePhotoAsBase64(photoUrl.value),
  };
  try{
    candidateId.value = await $api(`/api/candidateApp/create-candidate-from-linkedin`, { method: 'POST', body: input });
    isSucceeded.value = true;
  } catch (error) {
    console.log('error: ', error);
    alert('Error: ' + error.message);
    isSendingToHive.value = false;
    isSucceeded.value = false;
  } finally {
  }
}

const sendTabMessage = <T = any>(
    message: any,
    callback?: (response: T) => void
) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {type: message}, {}, callback);
    }
  });
};

const checkIfAtProfilePage = () => {
  if(isLoggedIn.value === false) {
    return;
  }

  sendTabMessage(
    "CHECK_IF_ON_PROFILE_PAGE", (response: { isOnProfilePage?: boolean }) => {
      if (response?.isOnProfilePage) {
        clearPolling();
        isOnProfilePage.value = true;
      }
    }
  );
};

const setupPolling = () => {
  pollingInterval.value = setInterval(() => {
    checkIfAtProfilePage();
  }, 1000); 
}

const clearPolling = () => {
  if (pollingInterval.value !== null) {
    clearInterval(pollingInterval.value);
    pollingInterval.value = null;
  }
};

const refresh = () => {
  checkIfAtProfilePage();
}

const login = () => {
  sendTabMessage("LOGIN", () => {});
}

const harvest = () => {
  photoUrl.value = '';
  sendTabMessage("HARVEST", () => {});
}

const goTo = () => {
  let candidateUrl = `${url}/candidates/details/${candidateId.value}`;
  window.open(candidateUrl, '_blank');
}

const cancel = () => {
  isSendingToHive.value = false;
  isSucceeded.value = false;
  clearPolling();
}

async function getProfilePhotoAsBase64(photoUrl: string): Promise<string | null> {
  try {
    const response = await fetch(photoUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting photo to base64:', error);
    return null;
  }
}

</script>

<template>
  <div class="container" v-if="isSendingToHive">
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
        <div style="margin-top: 16px; text-align: center;" v-if="!isSucceeded">
          <span>Sending Data...</span><br/><br/>
        </div>
        <div v-else>
          <span style="margin-left: 26px;">Candidate Created Successfully!</span><br/><br/>
          <div class="flex gap-2 justify-center">
            <button
                class="btn btn-primary"
                @click="cancel"
            >
              <i-ph-rewind />
              Back
            </button>

            <button
                class="btn btn-success"
                @click="goTo()"
            >
              <i-ph-rocket-launch />
              Go To Candidate
            </button>
          </div>
        </div>
        
      </div>
    </div>
  </div>
  <div class="text-center" v-if="!isLoggedIn">
    <button
        class="btn btn-secondary btn-lg"
        target="_blank"
        @click="login"
    >
      <i-ph-rocket-launch />
      Login Now
    </button>
  </div>
  <div class="container" v-if="!isOnProfilePage && !isLoading && isLoggedIn">
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
          <span>Searching for user profile...</span><br/><br/>
          <button class="btn btn-primary btn-md" @click="refresh()">
            Refresh
          </button>
        </div>
      </div>
    </div>
  </div>
  <div v-if="isOnProfilePage && isLoggedIn && !isSendingToHive">
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
        <div class="text-lg font-semibold mb-4">Phone Number</div>
        <input
            v-model="phoneNumber"
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
        <div class="text-lg font-semibold mb-4">Experiences</div>
        <textarea
          v-model="experiences"
          rows="5"
          class="input input-primary"
        />
      </div>
      <br />
      <div>
        <div class="text-lg font-semibold mb-4">Education</div>
        <textarea
          v-model="education"
          rows="5"
          class="input input-primary"
        />
      </div>
      <br />
      <div>
        <div class="text-lg font-semibold mb-4">Profile Photo</div>
        <div v-if="photoUrl" class="photo-preview">
          <img :src="photoUrl" alt="Profile Photo" class="profile-photo" />
        </div>
        <div v-else class="text-sm text-gray-500">
          No profile photo available
        </div>
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

        <button
            class="btn btn-success"
            @click="harvest()"
        >
          <i-ph-plant />
          Harvest
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
  width: 100% !important;
}

input {
  width: 100% !important;
}

.photo-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  border: 2px dashed #ccc;
  border-radius: 8px;
  background: #000;
}

.profile-photo {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #fbc02d;
}
</style>
