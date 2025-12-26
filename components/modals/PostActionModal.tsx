import { View, Text, Modal, Pressable } from 'react-native'

type Props = {
  visible: boolean
  onClose: () => void
}

export default function PostActionModal({
  visible,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: '#12182B',
            padding: 20,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            minHeight: 200,
          }}
        >
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 16,
              fontWeight: '700',
            }}
          >
            Post actions (placeholder)
          </Text>

          <Pressable
            onPress={onClose}
            style={{ marginTop: 20 }}
          >
            <Text style={{ color: '#6C8CFF' }}>
              Close
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
