module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // 新機能
        'fix', // バグ修正
        'docs', // ドキュメント
        'style', // フォーマット
        'refactor', // リファクタリング
        'test', // テスト
        'chore', // その他
        'ci', // CI関連
        'build', // ビルド関連
      ],
    ],
    'subject-max-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 100],
  },
}
