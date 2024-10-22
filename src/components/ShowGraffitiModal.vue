<template>
  <!-- Benutzerdefinierte Karte für ausgewähltes Graffiti -->
  <div>
    <n-modal :show="showGraffitiCard" @update:show="$emit('update:showGraffitiCard', $event)" closable>
        <n-card
            title="Informationen"
            :bordered="false"
            size="huge"
            role="dialog"
            aria-modal="true"
            style="width: 600px;"
        >
        <div id="graffiti-card-content">

            <n-tooltip trigger="hover" placement="bottom">
            <template #trigger>
                <n-image  :src="selectedGraffiti.imageURL" alt="Graffiti" width="200px" style="margin-right: 20px;" />
            </template>
            Klicke um das Bild zu vergrößern.
            </n-tooltip>
            <div>
            <h3 style="margin-bottom: 0;">Koordinaten:</h3>
            <n-text code>Lat: {{ selectedGraffiti.lat }}, Lng: {{ selectedGraffiti.lng }}</n-text>
            <h3 style="margin-bottom: 0;">Beschreibung:</h3>
            <n-text>
                {{ selectedGraffiti.title }}
            </n-text>
            </div>
        </div>
        <template #footer>
            <n-button style="margin-right: 10px;"@click="shareGraffiti(selectedGraffiti.id)" type="info" size="small">Graffiti teilen</n-button>
            <n-button v-if="userRole === 'admin'" @click="deleteGraffiti(selectedGraffiti.id)" type="error" size="small">Graffiti löschen</n-button>
            <n-button @click="reportGraffiti(selectedGraffiti.id)" v-else-if="user !== null" type="error" size="small">Graffiti melden</n-button>
        </template>
        </n-card>
    </n-modal>
    <n-modal v-model:show="shareGraffitiModal">
        <n-card title="Graffiti teilen" style="width: 300px;">
            <n-qr-code size="230" :value="shareGraffitiLink" />
            <n-input-group>
                <n-input readonly v-model:value="shareGraffitiLink" />
                <n-button @click="copyToClipboard"><n-icon size="22" :component="Copy16Regular" /></n-button>
            </n-input-group>
        </n-card>
    </n-modal>
  </div>
</template>

<script setup>
import { db } from '../firebase';
import { deleteDoc, doc, collection, addDoc } from 'firebase/firestore';
import { useMessage } from 'naive-ui';
import { ref } from 'vue';
import { Copy16Regular } from '@vicons/fluent';

const message = useMessage()
const props = defineProps({
  showGraffitiCard: Boolean,
  selectedGraffiti: Object,
  user: Object,
  userRole: String,
})

const shareGraffitiModal = ref(false)
const shareGraffitiLink = ref('')

const emit = defineEmits(['update:showGraffitiCard'])

const deleteGraffiti = async (id) => {
  await deleteDoc(doc(db, 'graffiti', id));
  emit('update:showGraffitiCard', false);
  // Hier müssen wir noch eine Möglichkeit finden, loadGraffitis aufzurufen
  // Eine Möglichkeit wäre, ein neues Event zu emittieren
  emit('graffitiDeleted');
  message.success('Graffiti erfolgreich gelöscht.');
}

const shareGraffiti = (id) => {
  shareGraffitiLink.value = `https://opengraffitimap.netlify.app/?open=${id}`;
  shareGraffitiModal.value = true;
}

const copyToClipboard = () => {
  navigator.clipboard.writeText(shareGraffitiLink.value);
  message.success('Link erfolgreich in die Zwischenablage kopiert.');
}


const reportGraffiti = async (id) => {
  await addDoc(collection(db, 'reports'), {
    graffitiId: id,
    userId: props.user.uid,
    createdAt: new Date()
  });
  message.success('Graffiti erfolgreich gemeldet.');
}
</script>

<style scoped>

@media (min-width: 600px) {
  #graffiti-card-content {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: left;
  }
}

</style>