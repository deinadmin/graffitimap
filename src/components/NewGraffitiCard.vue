<template>
  <n-card title="OpenGraffitiMap" id="new-graffiti-card">
    <template #header-extra>
      <n-tag type="info" size="small" round>
        BETA
      </n-tag>
    </template>
    <div style="margin-top: -15px;">
      <span style="font-size: 12px; color: #888;">Koordinaten</span>
      <n-input-group style="margin-bottom: 10px;">
        <n-input :disabled="!user" clearable v-model:value="newGraffiti.lat" type="text" placeholder="Breitengrad" />
        <n-input :disabled="!user" clearable v-model:value="newGraffiti.lng" type="text" placeholder="Längengrad" />
      </n-input-group>
      <n-alert :bordered="false" size="small" type="info">
        <span style="font-size: 12px;">Tippe auf die Karte, um die Koordinaten zu setzen.</span>
      </n-alert>
      <span style="font-size: 12px; color: #888;">Beschreibung</span>
      <n-input :disabled="!user" style="margin-bottom: 10px;" clearable v-model:value="newGraffiti.title" type="textarea" autosize rows="3" placeholder="Beschreibung" />
      <span style="font-size: 12px; color: #888;">Bild</span>
      <n-upload v-model:file-list="fileList" @remove="newGraffiti.imageURL = null" :disabled="!user" :multiple="false" :max="1" :custom-request="uploadImage" >
        <n-button :loading="uploading" block>Bild hochladen</n-button>
      </n-upload>
    </div>
    <n-button v-if="!user" @click="loginWithGoogle" type="error" block>Anmelden, um ein Graffiti zu posten</n-button>
    <n-button :loading="submitting" :disabled="uploading" v-else @click="handleGraffitiSubmit" type="primary" block>Neues Graffiti posten</n-button>
  </n-card>
</template>

<style scoped>
#new-graffiti-card {
  position: fixed;
  bottom: 10px;
  left: 10px;
  z-index: 1000;
  width: 380px;
}

@media (max-width: 600px) {
  #new-graffiti-card {
    width: 100%;
    bottom: 0;
    left: 0;
    border-radius: 0;
    margin: 0;
    padding: 0;
    border-left: none;
    border-right: none;
    border-bottom: none;
  }
}
</style>

<script setup>
import { ref } from 'vue'
import { useMessage } from 'naive-ui'

const message = useMessage()

const fileList = ref([])


const props = defineProps({
  user: {
    type: Object,
    required: true
  },
  newGraffiti: {
    type: Object,
    required: true
  },
  loginWithGoogle: {
    type: Function,
    required: true
  }
})

import { db } from '@/firebase'
import { collection, addDoc } from 'firebase/firestore'

const submitting = ref(false)
const emit = defineEmits(['graffiti-added'])

const handleGraffitiSubmit = async () => {
    if (!props.newGraffiti.lat || !props.newGraffiti.lng || !props.newGraffiti.title || !props.newGraffiti.imageURL) {
        message.error('Bitte fülle alle Felder aus.')
        return
    }

    submitting.value = true
    const graffitiCollection = collection(db, 'graffiti')
    await addDoc(graffitiCollection, {
        ...props.newGraffiti,
        user: {
            email: props.user.email,
            uid: props.user.uid
        }
    })
    submitting.value = false
    message.success('Graffiti erfolgreich gepostet.')
    props.newGraffiti.lat = ""
    props.newGraffiti.lng = ""
    props.newGraffiti.title = ""
    props.newGraffiti.imageURL = null
    fileList.value = []
    emit('graffiti-added')
}

const uploading = ref(false)

const uploadImage = (options) => {
  const { file, onFinish, onError } = options;
  uploading.value = true

  console.log(file)

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('image', file.file);
    formData.append('type', file.file.type);
    formData.append('title', file.file.name);
    formData.append('description', 'Von OpenGraffitiMap hochgeladen. Besuche uns für weitere Graffiti: https://opengraffitimap.de');

    fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID ' + import.meta.env.VITE_IMGUR_CLIENT_ID
      },
      body: formData
    })
    .then(response => response.json())
    .then(result => {
      console.log('Erfolgreich hochgeladen:', result);
      message.success('Das Bild wurde hochgeladen.');
      props.newGraffiti.imageURL = result.data.link;
      uploading.value = false
      onFinish();
      resolve(result);
    })
    .catch(error => {
      console.error('Fehler beim Hochladen:', error);
      message.error('Fehler beim Hochladen des Bildes.');
      uploading.value = false
      onError();
      reject(error);
    });
  });
}

</script>

<style scoped>

</style>
