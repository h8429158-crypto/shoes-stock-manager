import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { COLORS, formatMoney, toNumber } from '../theme';

async function compressToBase64(uri) {
  // Shrink the photo so it fits comfortably inside a Firestore document
  // (1 MB limit) and stays fast to sync on mobile data.
  let result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 600 } }],
    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );
  if (result.base64 && result.base64.length > 700000) {
    result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 400 } }],
      { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
  }
  return result.base64;
}

export default function AddEditShoeScreen({ navigation, route }) {
  const existing = route.params?.shoe || null;

  const [name, setName] = useState(existing?.name || '');
  const [articleNo, setArticleNo] = useState(existing?.articleNo || '');
  const [brand, setBrand] = useState(existing?.brand || '');
  const [cartons, setCartons] = useState(
    existing ? String(existing.cartons) : ''
  );
  const [pairsPerCarton, setPairsPerCarton] = useState(
    existing ? String(existing.pairsPerCarton) : ''
  );
  const [colorType, setColorType] = useState(existing?.colorType || 'single');
  const [colors, setColors] = useState(existing?.colors || '');
  const [sizes, setSizes] = useState(existing?.sizes || '');
  const [costPrice, setCostPrice] = useState(
    existing ? String(existing.costPrice) : ''
  );
  const [sellingPrice, setSellingPrice] = useState(
    existing ? String(existing.sellingPrice) : ''
  );
  const [location, setLocation] = useState(existing?.location || '');
  const [notes, setNotes] = useState(existing?.notes || '');
  const [photo, setPhoto] = useState(existing?.photo || null);
  const [saving, setSaving] = useState(false);

  const pickImage = async (fromCamera) => {
    try {
      if (fromCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Camera not allowed', 'Please allow camera access in your phone settings.');
          return;
        }
      }
      const picker = fromCamera
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;
      const result = await picker({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhoto(await compressToBase64(result.assets[0].uri));
      }
    } catch (e) {
      Alert.alert('Photo problem', 'Could not add the photo. Please try again.');
    }
  };

  const choosePhoto = () => {
    Alert.alert('Shoe photo', 'Where do you want the photo from?', [
      { text: 'Take photo 📷', onPress: () => pickImage(true) },
      { text: 'Choose from gallery 🖼️', onPress: () => pickImage(false) },
      ...(photo
        ? [{ text: 'Remove photo', style: 'destructive', onPress: () => setPhoto(null) }]
        : []),
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Please enter the shoe name.');
      return;
    }
    if (toNumber(cartons) <= 0 || toNumber(pairsPerCarton) <= 0) {
      Alert.alert(
        'Missing info',
        'Please enter how many cartons you have and how many pairs are in one carton.'
      );
      return;
    }
    if (toNumber(costPrice) <= 0) {
      Alert.alert('Missing info', 'Please enter the cost price per pair.');
      return;
    }

    setSaving(true);
    const data = {
      name: name.trim(),
      articleNo: articleNo.trim(),
      brand: brand.trim(),
      cartons: toNumber(cartons),
      pairsPerCarton: toNumber(pairsPerCarton),
      colorType,
      colors: colors.trim(),
      sizes: sizes.trim(),
      costPrice: toNumber(costPrice),
      sellingPrice: toNumber(sellingPrice),
      location: location.trim(),
      notes: notes.trim(),
      photo: photo || null,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser?.email || '',
    };

    try {
      if (existing) {
        await updateDoc(doc(db, 'shoes', existing.id), data);
      } else {
        await addDoc(collection(db, 'shoes'), {
          ...data,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser?.email || '',
        });
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert('Could not save', 'Please check your internet connection and try again.\n\n' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const previewPairs = toNumber(cartons) * toNumber(pairsPerCarton);
  const previewCost = previewPairs * toNumber(costPrice);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo */}
        <TouchableOpacity style={styles.photoBox} onPress={choosePhoto}>
          {photo ? (
            <Image
              source={{ uri: `data:image/jpeg;base64,${photo}` }}
              style={styles.photo}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={{ fontSize: 36 }}>📷</Text>
              <Text style={styles.photoHint}>Tap to add shoe photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.section}>Shoe details</Text>
        <Field label="Shoe name *" value={name} onChange={setName} placeholder="e.g. Sports Running Shoe" />
        <View style={styles.row}>
          <Field label="Article no." value={articleNo} onChange={setArticleNo} placeholder="e.g. A-101" half />
          <Field label="Brand" value={brand} onChange={setBrand} placeholder="e.g. Campus" half />
        </View>

        <Text style={styles.section}>Cartons</Text>
        <View style={styles.row}>
          <Field label="No. of cartons *" value={cartons} onChange={setCartons} placeholder="e.g. 10" numeric half />
          <Field label="Pairs in 1 carton *" value={pairsPerCarton} onChange={setPairsPerCarton} placeholder="e.g. 12" numeric half />
        </View>

        <Text style={styles.label}>Colour in carton</Text>
        <View style={styles.toggleRow}>
          {[
            ['single', 'Single colour'],
            ['mixed', 'Mixed colours'],
          ].map(([value, text]) => (
            <TouchableOpacity
              key={value}
              style={[styles.toggle, colorType === value && styles.toggleActive]}
              onPress={() => setColorType(value)}
            >
              <Text
                style={[
                  styles.toggleText,
                  colorType === value && styles.toggleTextActive,
                ]}
              >
                {text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Field
          label={colorType === 'single' ? 'Colour' : 'Which colours?'}
          value={colors}
          onChange={setColors}
          placeholder={
            colorType === 'single' ? 'e.g. Black' : 'e.g. Black, Brown, Navy'
          }
        />
        <Field
          label="Sizes in 1 carton"
          value={sizes}
          onChange={setSizes}
          placeholder="e.g. 6×2, 7×3, 8×3, 9×2, 10×2"
        />

        <Text style={styles.section}>Prices (per pair)</Text>
        <View style={styles.row}>
          <Field label="Cost price *" value={costPrice} onChange={setCostPrice} placeholder="e.g. 250" numeric half />
          <Field label="Selling price" value={sellingPrice} onChange={setSellingPrice} placeholder="e.g. 320" numeric half />
        </View>

        <Text style={styles.section}>Storage</Text>
        <Field label="Stocked at (place)" value={location} onChange={setLocation} placeholder="e.g. Godown 2, Rack B" />
        <Field label="Notes" value={notes} onChange={setNotes} placeholder="Anything extra…" multiline />

        {previewPairs > 0 ? (
          <View style={styles.preview}>
            <Text style={styles.previewText}>
              Total: <Text style={styles.previewBold}>{previewPairs} pairs</Text>
              {previewCost > 0 ? (
                <>
                  {'  ·  Stock cost: '}
                  <Text style={styles.previewBold}>{formatMoney(previewCost)}</Text>
                </>
              ) : null}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          onPress={save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>
              {existing ? 'Save Changes' : 'Add to Stock'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, numeric, half, multiline }) {
  return (
    <View style={[styles.field, half && { flex: 1 }]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { height: 80, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        keyboardType={numeric ? 'numeric' : 'default'}
        multiline={!!multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  photoBox: {
    alignSelf: 'center',
    width: 150,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 6,
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoHint: { fontSize: 12, color: COLORS.textLight, marginTop: 6 },
  section: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 18,
    marginBottom: 4,
  },
  row: { flexDirection: 'row', gap: 10 },
  field: { marginTop: 8 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
    marginBottom: 5,
    marginTop: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 16,
    color: COLORS.text,
  },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggle: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  toggleText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  toggleTextActive: { color: '#fff' },
  preview: {
    backgroundColor: '#eaf1fb',
    borderRadius: 10,
    padding: 12,
    marginTop: 18,
  },
  previewText: { fontSize: 15, color: COLORS.text, textAlign: 'center' },
  previewBold: { fontWeight: '800', color: COLORS.primary },
  saveButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  saveText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
