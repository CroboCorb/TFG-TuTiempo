import React, { useState } from "react";
import { Button, Dialog, Portal, Searchbar } from "react-native-paper";

export default function AddCityDialog({ visible, hideDialog }) {
  const [nuevaCiudad, setNuevaCiudad] = useState('');

  const guardarNuevaCiudad = async() => {

    hideDialog();
  }

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={hideDialog}>
        <Dialog.Title>Añadir nueva ciudad</Dialog.Title>
        <Dialog.Content>
          <Searchbar
            mode="view"
            placeholder="Sevilla"
            onChangeText={setNuevaCiudad}
            value={nuevaCiudad}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={guardarNuevaCiudad}>Añadir</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
