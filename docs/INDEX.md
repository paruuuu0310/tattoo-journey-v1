# Tattoo Journey 2.0 - ドキュメントインデックス 📚

このディレクトリには、Tattoo Journey 2.0プロジェクトの全技術文書が整理されています。

## 📋 ドキュメント構成

### 🏗️ [setup/](setup/) - セットアップ・環境構築

開発環境の構築とプロジェクトセットアップに関する文書

| ファイル                                                       | 内容                           | 対象者    |
| -------------------------------------------------------------- | ------------------------------ | --------- |
| [DEVELOPMENT_SETUP.md](setup/DEVELOPMENT_SETUP.md)             | 開発環境構築の詳細手順         | 全開発者  |
| [CLEANUP_RECOMMENDATIONS.md](setup/CLEANUP_RECOMMENDATIONS.md) | プロジェクト整理・最適化ガイド | Tech Lead |

### 🏛️ [architecture/](architecture/) - アーキテクチャ設計

システムアーキテクチャとデザインシステムの設計文書

| ファイル                                                                      | 内容                         | 対象者                     |
| ----------------------------------------------------------------------------- | ---------------------------- | -------------------------- |
| [DESIGN_SYSTEM.md](architecture/DESIGN_SYSTEM.md)                             | UI/UXデザインシステム仕様    | デザイナー・フロントエンド |
| [FILE_STRUCTURE_AUDIT_REPORT.md](architecture/FILE_STRUCTURE_AUDIT_REPORT.md) | プロジェクト構造監査レポート | Tech Lead・PM              |

### 🔒 [security/](security/) - セキュリティ仕様

セキュリティ実装とコンプライアンス関連文書

| ファイル                                                                                          | 内容                               | 対象者           |
| ------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------- |
| [SECURITY_COMPLETION_REPORT.md](security/SECURITY_COMPLETION_REPORT.md)                           | セキュリティ実装完了レポート       | 全チーム         |
| [SECURITY_EMERGENCY_ACTIONS.md](security/SECURITY_EMERGENCY_ACTIONS.md)                           | セキュリティインシデント対応手順   | DevOps・PM       |
| [SECURITY_RULES_GUIDE.md](security/SECURITY_RULES_GUIDE.md)                                       | Firebaseセキュリティルール設計指針 | バックエンド     |
| [SECURITY_TICKETS.md](security/SECURITY_TICKETS.md)                                               | セキュリティ関連タスク管理         | 全チーム         |
| [PENTAGON_SECURITY_IMPLEMENTATION_REPORT.md](security/PENTAGON_SECURITY_IMPLEMENTATION_REPORT.md) | 高度セキュリティ実装レポート       | セキュリティ専門 |
| [PENTAGON_SECURITY_REQUIREMENTS.md](security/PENTAGON_SECURITY_REQUIREMENTS.md)                   | 高度セキュリティ要件定義           | セキュリティ専門 |

### 🧪 [testing/](testing/) - テスト戦略

テスト戦略と自動化テストの実装ガイド

| ファイル                                 | 内容                   | 対象者       |
| ---------------------------------------- | ---------------------- | ------------ |
| [TEST_README.md](testing/TEST_README.md) | 包括的テスト実装ガイド | QA・全開発者 |

### 📊 [project-management/](project-management/) - プロジェクト管理

プロジェクト進捗管理とタスク追跡文書

| ファイル                                                                                | 内容                       | 対象者        |
| --------------------------------------------------------------------------------------- | -------------------------- | ------------- |
| [PROJECT_TICKETS.md](project-management/PROJECT_TICKETS.md)                             | プロジェクト全体タスク管理 | PM・Tech Lead |
| [PROJECT_ORGANIZATION.md](project-management/PROJECT_ORGANIZATION.md)                   | プロジェクト組織構成       | 全チーム      |
| [IMPLEMENTATION_TICKETS.md](project-management/IMPLEMENTATION_TICKETS.md)               | 実装タスクの詳細管理       | 全開発者      |
| [STRUCTURE_IMPROVEMENT_TICKETS.md](project-management/STRUCTURE_IMPROVEMENT_TICKETS.md) | 構造改善タスク管理         | Tech Lead     |

## 🎯 ロール別推奨閲覧順序

### 👩‍💻 **新規開発者**

1. [README.md](../README.md) - プロジェクト概要
2. [setup/DEVELOPMENT_SETUP.md](setup/DEVELOPMENT_SETUP.md) - 環境構築
3. [architecture/DESIGN_SYSTEM.md](architecture/DESIGN_SYSTEM.md) - デザインシステム理解
4. [testing/TEST_README.md](testing/TEST_README.md) - テスト戦略

### 🏗️ **Tech Lead**

1. [architecture/FILE_STRUCTURE_AUDIT_REPORT.md](architecture/FILE_STRUCTURE_AUDIT_REPORT.md) - 構造評価
2. [project-management/STRUCTURE_IMPROVEMENT_TICKETS.md](project-management/STRUCTURE_IMPROVEMENT_TICKETS.md) - 改善計画
3. [setup/CLEANUP_RECOMMENDATIONS.md](setup/CLEANUP_RECOMMENDATIONS.md) - 最適化指針
4. [security/](security/) - セキュリティ全般

### 📋 **Project Manager**

1. [project-management/PROJECT_TICKETS.md](project-management/PROJECT_TICKETS.md) - タスク全体像
2. [project-management/PROJECT_ORGANIZATION.md](project-management/PROJECT_ORGANIZATION.md) - 組織構成
3. [security/SECURITY_EMERGENCY_ACTIONS.md](security/SECURITY_EMERGENCY_ACTIONS.md) - 緊急時対応
4. [architecture/FILE_STRUCTURE_AUDIT_REPORT.md](architecture/FILE_STRUCTURE_AUDIT_REPORT.md) - 技術評価

### 🔒 **セキュリティ担当**

1. [security/SECURITY_COMPLETION_REPORT.md](security/SECURITY_COMPLETION_REPORT.md) - 実装状況
2. [security/SECURITY_RULES_GUIDE.md](security/SECURITY_RULES_GUIDE.md) - Firebase設定
3. [security/PENTAGON_SECURITY_REQUIREMENTS.md](security/PENTAGON_SECURITY_REQUIREMENTS.md) - 高度要件
4. [security/SECURITY_EMERGENCY_ACTIONS.md](security/SECURITY_EMERGENCY_ACTIONS.md) - インシデント対応

### 🧪 **QAエンジニア**

1. [testing/TEST_README.md](testing/TEST_README.md) - テスト戦略全体
2. [setup/DEVELOPMENT_SETUP.md](setup/DEVELOPMENT_SETUP.md) - 環境構築
3. [security/SECURITY_COMPLETION_REPORT.md](security/SECURITY_COMPLETION_REPORT.md) - セキュリティテスト

## 📝 ドキュメント更新ルール

1. **即時更新**: 実装変更時は関連ドキュメントを同時更新
2. **レビュー必須**: 新規・大幅変更時はチームレビューを実施
3. **バージョン管理**: 重要変更は変更履歴をドキュメント末尾に記載
4. **アクセシビリティ**: 簡潔で検索しやすい構成を維持

## 🔗 関連リンク

- [プロジェクトルートREADME](../README.md)
- [GitHub Issues](https://github.com/karamon/tattoo-journey-2.0/issues)
- [開発環境セットアップ](setup/DEVELOPMENT_SETUP.md)
- [テスト実行ガイド](testing/TEST_README.md)

---

**最終更新**: 2024-08-27  
**管理者**: Tech Lead Team  
**レビュー周期**: 月1回または重要変更時
