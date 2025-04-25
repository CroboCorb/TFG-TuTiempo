import { Text, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Appbar, Button } from "react-native-paper";

export default function Index() {
  const router = useRouter();

  return (
    <View style={{backgroundColor: '#4682B4', flex: 1}}>
      <Appbar.Header
      mode="center-aligned"
        style={{
          backgroundColor: "#4682B4",
        }}
      >
        <Appbar.Action icon="plus" onPress={async() => {router.navigate('/addCity')}} />
        <Appbar.Content
          title="Nombre Pueblo"
          style={{ justifyContent: "center" }}
        />
        <Appbar.Action icon="cog" onPress={async() => {router.navigate('/options')}} />
      </Appbar.Header>
      
      <ScrollView
        contentContainerStyle={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Button
          onPress={async () => {
            router.navigate("/admin/testing");
          }}
        >
          <Text style={{ color: "black" }}>Navegar a login</Text>
        </Button>
      </ScrollView>
    </View>
  );
}
