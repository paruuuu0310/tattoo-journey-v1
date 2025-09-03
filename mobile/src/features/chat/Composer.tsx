import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Keyboard,
  Animated,
  Dimensions,
} from "react-native";
import { TattooSize } from "../../types";
import telemetry from "../../lib/telemetry";

interface SlashCommand {
  command: string;
  description: string;
  icon: string;
  category: "booking" | "info" | "action";
  parameters?: SlashCommandParameter[];
}

interface SlashCommandParameter {
  name: string;
  type: "text" | "number" | "select" | "multiselect";
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface ComposerProps {
  onSendMessage: (message: string, metadata?: Record<string, any>) => void;
  onSlashCommandExecuted?: (
    command: string,
    params: Record<string, any>,
  ) => void;
  disabled?: boolean;
  placeholder?: string;
  showSlashCommands?: boolean;
  contextType?: "general" | "booking" | "inquiry";
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: "/size",
    description: "タトゥーのサイズ情報を入力",
    icon: "📏",
    category: "booking",
    parameters: [
      {
        name: "size",
        type: "select",
        required: true,
        options: ["small", "medium", "large", "extra-large"],
        placeholder: "サイズを選択",
      },
      {
        name: "dimensions",
        type: "text",
        required: false,
        placeholder: "具体的なサイズ (例: 10cm x 5cm)",
      },
    ],
  },
  {
    command: "/budget",
    description: "予算範囲を入力",
    icon: "💰",
    category: "booking",
    parameters: [
      {
        name: "min",
        type: "number",
        required: true,
        placeholder: "最低価格（円）",
      },
      {
        name: "max",
        type: "number",
        required: true,
        placeholder: "最高価格（円）",
      },
      {
        name: "flexible",
        type: "select",
        required: false,
        options: ["yes", "no"],
        placeholder: "価格交渉可能？",
      },
    ],
  },
  {
    command: "/placement",
    description: "タトゥーを入れる部位を指定",
    icon: "📍",
    category: "booking",
    parameters: [
      {
        name: "bodyPart",
        type: "select",
        required: true,
        options: [
          "腕",
          "足",
          "背中",
          "胸",
          "肩",
          "手首",
          "足首",
          "首",
          "顔",
          "その他",
        ],
        placeholder: "部位を選択",
      },
      {
        name: "side",
        type: "select",
        required: false,
        options: ["left", "right", "center", "both"],
        placeholder: "左右・位置",
      },
      {
        name: "notes",
        type: "text",
        required: false,
        placeholder: "詳細な位置や要望",
      },
    ],
  },
  {
    command: "/style",
    description: "好みのタトゥースタイル",
    icon: "🎨",
    category: "info",
    parameters: [
      {
        name: "styles",
        type: "multiselect",
        required: true,
        options: [
          "リアリズム",
          "トラディショナル",
          "ネオトラディショナル",
          "ジャパニーズ",
          "ブラック＆グレー",
          "カラー",
          "ジオメトリック",
          "ミニマル",
          "トライバル",
        ],
        placeholder: "スタイルを選択（複数可）",
      },
    ],
  },
  {
    command: "/availability",
    description: "希望日時を入力",
    icon: "📅",
    category: "booking",
    parameters: [
      {
        name: "preferredDate",
        type: "text",
        required: true,
        placeholder: "第一希望日 (YYYY-MM-DD)",
      },
      {
        name: "alternativeDate",
        type: "text",
        required: false,
        placeholder: "第二希望日 (YYYY-MM-DD)",
      },
      {
        name: "timePreference",
        type: "select",
        required: false,
        options: ["morning", "afternoon", "evening", "flexible"],
        placeholder: "時間帯の希望",
      },
    ],
  },
  {
    command: "/help",
    description: "ヘルプとよくある質問",
    icon: "❓",
    category: "info",
  },
];

export const ChatComposer: React.FC<ComposerProps> = ({
  onSendMessage,
  onSlashCommandExecuted,
  disabled = false,
  placeholder = "メッセージを入力...",
  showSlashCommands = true,
  contextType = "general",
}) => {
  const [inputText, setInputText] = useState("");
  const [isCommandMode, setIsCommandMode] = useState(false);
  const [activeCommand, setActiveCommand] = useState<SlashCommand | null>(null);
  const [commandParams, setCommandParams] = useState<Record<string, any>>({});
  const [filteredCommands, setFilteredCommands] = useState<SlashCommand[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const suggestionHeight = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = Dimensions.get("window");

  // Filter commands based on input and context
  useEffect(() => {
    if (!showSlashCommands) return;

    const input = inputText.toLowerCase();
    const isSlashInput = input.startsWith("/");

    if (isSlashInput) {
      const query = input.slice(1);
      const filtered = SLASH_COMMANDS.filter((cmd) => {
        const matchesQuery =
          cmd.command.slice(1).includes(query) ||
          cmd.description.toLowerCase().includes(query);
        const matchesContext =
          contextType === "general" ||
          cmd.category === "info" ||
          (contextType === "booking" && cmd.category === "booking");
        return matchesQuery && matchesContext;
      });

      setFilteredCommands(filtered);
      setShowSuggestions(filtered.length > 0 && query.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredCommands([]);
    }
  }, [inputText, showSlashCommands, contextType]);

  // Animate suggestions panel
  useEffect(() => {
    Animated.timing(suggestionHeight, {
      toValue: showSuggestions
        ? Math.min(filteredCommands.length * 60, 240)
        : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [showSuggestions, filteredCommands.length, suggestionHeight]);

  const handleInputChange = useCallback(
    (text: string) => {
      setInputText(text);

      if (text.startsWith("/") && !isCommandMode) {
        setIsCommandMode(true);
      } else if (!text.startsWith("/") && isCommandMode) {
        setIsCommandMode(false);
        setActiveCommand(null);
        setCommandParams({});
      }
    },
    [isCommandMode],
  );

  const selectCommand = useCallback(
    (command: SlashCommand) => {
      setActiveCommand(command);
      setInputText(`${command.command} `);
      setShowSuggestions(false);
      setIsCommandMode(true);

      telemetry.trackCommunication("slash_command_used", {
        command: command.command,
        chatType: contextType === "booking" ? "booking" : "general",
      });

      // Auto-focus on input for parameter entry
      if (command.parameters && command.parameters.length > 0) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [contextType],
  );

  const executeCommand = useCallback(() => {
    if (!activeCommand) return;

    let message = activeCommand.command;
    const params: Record<string, any> = { ...commandParams };

    // Validate required parameters
    const missingRequired =
      activeCommand.parameters?.filter(
        (param) => param.required && !params[param.name],
      ) || [];

    if (missingRequired.length > 0) {
      Alert.alert(
        "必須項目が未入力です",
        `以下の項目を入力してください: ${missingRequired.map((p) => p.name).join(", ")}`,
      );
      return;
    }

    // Build formatted message
    switch (activeCommand.command) {
      case "/size":
        message = `📏 サイズ情報\n`;
        message += `• サイズ: ${getSizeLabel(params.size)}\n`;
        if (params.dimensions) {
          message += `• 具体的サイズ: ${params.dimensions}\n`;
        }
        break;

      case "/budget":
        message = `💰 予算情報\n`;
        message += `• 予算範囲: ¥${parseInt(params.min).toLocaleString()} - ¥${parseInt(params.max).toLocaleString()}\n`;
        if (params.flexible === "yes") {
          message += `• 価格交渉: 可能\n`;
        }
        break;

      case "/placement":
        message = `📍 タトゥーの部位\n`;
        message += `• 部位: ${params.bodyPart}\n`;
        if (params.side) {
          message += `• 位置: ${getSideLabel(params.side)}\n`;
        }
        if (params.notes) {
          message += `• 詳細: ${params.notes}\n`;
        }
        break;

      case "/style":
        message = `🎨 希望スタイル\n`;
        if (Array.isArray(params.styles)) {
          message += params.styles
            .map((style: string) => `• ${style}`)
            .join("\n");
        }
        break;

      case "/availability":
        message = `📅 希望日時\n`;
        message += `• 第一希望: ${params.preferredDate}\n`;
        if (params.alternativeDate) {
          message += `• 第二希望: ${params.alternativeDate}\n`;
        }
        if (params.timePreference) {
          message += `• 時間帯: ${getTimeLabel(params.timePreference)}\n`;
        }
        break;

      case "/help":
        message = `❓ ヘルプ\nご不明な点がございましたら、以下の情報をお知らせください：\n• 希望するタトゥーのイメージ\n• サイズと部位\n• 予算範囲\n• 希望日時`;
        break;
    }

    // Send the formatted message
    onSendMessage(message, {
      isSlashCommand: true,
      command: activeCommand.command,
      parameters: params,
    });

    // Notify parent component
    onSlashCommandExecuted?.(activeCommand.command, params);

    // Reset state
    setInputText("");
    setIsCommandMode(false);
    setActiveCommand(null);
    setCommandParams({});
    setShowSuggestions(false);

    // Hide keyboard
    Keyboard.dismiss();
  }, [activeCommand, commandParams, onSendMessage, onSlashCommandExecuted]);

  const sendRegularMessage = useCallback(() => {
    if (inputText.trim() === "") return;

    onSendMessage(inputText.trim());

    telemetry.trackCommunication("chat_message_sent", {
      messageLength: inputText.length,
      hasMedia: false, // Text only for now
      chatType: contextType === "booking" ? "booking" : "general",
    });

    setInputText("");
    Keyboard.dismiss();
  }, [inputText, onSendMessage, contextType]);

  const handleSend = useCallback(() => {
    if (activeCommand && activeCommand.parameters) {
      executeCommand();
    } else {
      sendRegularMessage();
    }
  }, [activeCommand, executeCommand, sendRegularMessage]);

  const renderParameterInput = (param: SlashCommandParameter) => {
    const value = commandParams[param.name];

    switch (param.type) {
      case "select":
        return (
          <View key={param.name} style={styles.parameterRow}>
            <Text style={styles.parameterLabel}>{param.placeholder}:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {param.options?.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.optionChip,
                    value === option && styles.optionChipSelected,
                  ]}
                  onPress={() =>
                    setCommandParams((prev) => ({
                      ...prev,
                      [param.name]: option,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      value === option && styles.optionTextSelected,
                    ]}
                  >
                    {param.name === "size"
                      ? getSizeLabel(option)
                      : param.name === "side"
                        ? getSideLabel(option)
                        : param.name === "timePreference"
                          ? getTimeLabel(option)
                          : option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );

      case "multiselect":
        return (
          <View key={param.name} style={styles.parameterRow}>
            <Text style={styles.parameterLabel}>{param.placeholder}:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {param.options?.map((option) => {
                const isSelected =
                  Array.isArray(value) && value.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.optionChip,
                      isSelected && styles.optionChipSelected,
                    ]}
                    onPress={() => {
                      setCommandParams((prev) => {
                        const currentValues = Array.isArray(prev[param.name])
                          ? prev[param.name]
                          : [];
                        const newValues = isSelected
                          ? currentValues.filter((v: string) => v !== option)
                          : [...currentValues, option];

                        return {
                          ...prev,
                          [param.name]: newValues,
                        };
                      });
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        );

      case "text":
      case "number":
        return (
          <View key={param.name} style={styles.parameterRow}>
            <Text style={styles.parameterLabel}>{param.placeholder}:</Text>
            <TextInput
              style={styles.parameterInput}
              value={value || ""}
              onChangeText={(text) =>
                setCommandParams((prev) => ({
                  ...prev,
                  [param.name]:
                    param.type === "number"
                      ? text.replace(/[^0-9]/g, "")
                      : text,
                }))
              }
              placeholder={param.placeholder}
              keyboardType={param.type === "number" ? "numeric" : "default"}
              placeholderTextColor="#999"
            />
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Slash Command Suggestions */}
      <Animated.View
        style={[styles.suggestionsContainer, { height: suggestionHeight }]}
      >
        <ScrollView style={styles.suggestionsList}>
          {filteredCommands.map((command) => (
            <TouchableOpacity
              key={command.command}
              style={styles.suggestionItem}
              onPress={() => selectCommand(command)}
            >
              <Text style={styles.suggestionIcon}>{command.icon}</Text>
              <View style={styles.suggestionContent}>
                <Text style={styles.suggestionCommand}>{command.command}</Text>
                <Text style={styles.suggestionDescription}>
                  {command.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Command Parameter Inputs */}
      {activeCommand && activeCommand.parameters && (
        <View style={styles.parametersContainer}>
          <Text style={styles.commandTitle}>
            {activeCommand.icon} {activeCommand.command} -{" "}
            {activeCommand.description}
          </Text>
          {activeCommand.parameters.map(renderParameterInput)}
        </View>
      )}

      {/* Message Composer */}
      <View style={styles.composerContainer}>
        <TextInput
          ref={inputRef}
          style={[styles.textInput, disabled && styles.textInputDisabled]}
          value={inputText}
          onChangeText={handleInputChange}
          placeholder={
            activeCommand
              ? `${activeCommand.command} のパラメータを設定してください...`
              : placeholder
          }
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
          editable={!disabled}
          blurOnSubmit={false}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (inputText.trim() === "" || disabled) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={inputText.trim() === "" || disabled}
        >
          <Text style={styles.sendButtonText}>
            {activeCommand ? "実行" : "送信"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Command Help */}
      {showSlashCommands && !isCommandMode && (
        <Text style={styles.helpText}>
          💡 "/" で始めるとコマンドが使用できます
        </Text>
      )}
    </View>
  );
};

// Helper functions for label translation
const getSizeLabel = (size: string): string => {
  const labels: Record<string, string> = {
    small: "小 (5cm以下)",
    medium: "中 (5-15cm)",
    large: "大 (15cm以上)",
    "extra-large": "特大 (20cm以上)",
  };
  return labels[size] || size;
};

const getSideLabel = (side: string): string => {
  const labels: Record<string, string> = {
    left: "左",
    right: "右",
    center: "中央",
    both: "両方",
  };
  return labels[side] || side;
};

const getTimeLabel = (time: string): string => {
  const labels: Record<string, string> = {
    morning: "午前",
    afternoon: "午後",
    evening: "夕方",
    flexible: "時間指定なし",
  };
  return labels[time] || time;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a1a",
  },

  // Suggestions
  suggestionsContainer: {
    backgroundColor: "#2a2a2a",
    borderTopWidth: 1,
    borderTopColor: "#333",
    overflow: "hidden",
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  suggestionIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 30,
    textAlign: "center",
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionCommand: {
    color: "#ff6b6b",
    fontSize: 16,
    fontWeight: "600",
  },
  suggestionDescription: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 2,
  },

  // Parameters
  parametersContainer: {
    backgroundColor: "#2a2a2a",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#333",
  },
  commandTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  parameterRow: {
    marginBottom: 12,
  },
  parameterLabel: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 6,
  },
  parameterInput: {
    backgroundColor: "#333",
    borderRadius: 8,
    padding: 10,
    color: "#fff",
    fontSize: 16,
  },
  optionChip: {
    backgroundColor: "#333",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 6,
  },
  optionChipSelected: {
    backgroundColor: "#ff6b6b",
  },
  optionText: {
    color: "#aaa",
    fontSize: 14,
  },
  optionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },

  // Composer
  composerContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    backgroundColor: "#1a1a1a",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    color: "#fff",
    fontSize: 16,
    maxHeight: 120,
  },
  textInputDisabled: {
    opacity: 0.5,
  },
  sendButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#555",
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Help
  helpText: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});

export default ChatComposer;
