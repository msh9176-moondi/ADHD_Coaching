"""
ADHD 코칭 AI 학습 데이터 생성기
추출된 텍스트 청크로부터 Q&A 쌍 및 선호도 데이터를 생성합니다.
"""

import os
import json
import time
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict

# API 클라이언트
try:
    from anthropic import Anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


@dataclass
class QAPair:
    """질문-답변 쌍"""
    question: str
    answer: str
    source: str
    category: str  # 예: 시간관리, 감정조절, 실행기능 등


@dataclass
class PreferencePair:
    """선호도 쌍 (DPO 학습용)"""
    prompt: str
    chosen: str      # ADHD 친화적 응답
    rejected: str    # 일반적/부적절한 응답
    source: str


class TrainingDataGenerator:
    """학습 데이터 생성기"""

    SYSTEM_PROMPT = """당신은 ADHD 코칭 전문가입니다.
주어진 ADHD 관련 텍스트를 바탕으로 코칭에 활용할 수 있는 학습 데이터를 생성합니다.

ADHD 코칭의 핵심 원칙:
1. 작은 단계로 나누기 - 큰 목표를 작고 즉시 실행 가능한 단위로
2. 외부 구조화 - 시각적 알림, 체크리스트 등 외부 도구 활용
3. 즉각적 피드백 - 지연된 보상보다 즉각적인 성취감
4. 감정 인정 - 좌절감, 수치심을 인정하고 공감
5. 강점 기반 - 약점 보완보다 강점 활용
6. 유연한 접근 - 완벽보다 진행을 중시"""

    QA_GENERATION_PROMPT = """다음 ADHD 관련 텍스트를 읽고, 피코치(ADHD를 가진 사람)가 코치에게 물을 수 있는 질문과
ADHD 친화적인 답변을 3개 생성해주세요.

텍스트:
{text}

다음 JSON 형식으로 응답해주세요:
```json
[
  {{
    "question": "피코치가 할 수 있는 질문",
    "answer": "ADHD 특성을 고려한 공감적이고 실용적인 답변",
    "category": "카테고리 (시간관리/감정조절/실행기능/집중력/대인관계/자기관리 중 하나)"
  }}
]
```

답변 작성 시 주의사항:
- 공감으로 시작하기 ("그 마음 이해해요", "많이 힘드셨겠어요")
- 구체적이고 즉시 실행 가능한 조언
- ADHD 뇌의 특성을 인정하는 표현 사용
- 완벽을 요구하지 않기
- 작은 성공 경험을 강조"""

    PREFERENCE_GENERATION_PROMPT = """다음 ADHD 관련 텍스트를 바탕으로, DPO(선호도 최적화) 학습용 데이터를 2개 생성해주세요.

텍스트:
{text}

각 데이터는 다음을 포함해야 합니다:
- prompt: 피코치의 고민이나 질문
- chosen: ADHD 친화적이고 공감적인 코치 응답 (선호되는 응답)
- rejected: 일반적이거나 ADHD에 부적절한 응답 (기피되는 응답)

다음 JSON 형식으로 응답해주세요:
```json
[
  {{
    "prompt": "피코치의 고민/질문",
    "chosen": "ADHD 친화적 응답 - 공감적, 구체적, 작은 단계로 나눔, 완벽을 요구하지 않음",
    "rejected": "부적절한 응답 - 일반적 조언, 의지력 강조, 비현실적 목표, 공감 부족"
  }}
]
```

rejected 응답의 특징 (피해야 할 것):
- "의지력만 있으면 돼요", "집중하세요", "계획을 세우세요" 같은 일반적 조언
- ADHD 특성을 무시한 조언
- 너무 많은 단계나 복잡한 시스템 제안
- 공감 없이 바로 해결책 제시"""

    def __init__(self, api_provider: str = "anthropic", api_key: str = None):
        self.api_provider = api_provider

        if api_provider == "anthropic":
            if not ANTHROPIC_AVAILABLE:
                raise ImportError("anthropic 패키지를 설치하세요: pip install anthropic")
            self.client = Anthropic(api_key=api_key) if api_key else Anthropic()
        elif api_provider == "openai":
            if not OPENAI_AVAILABLE:
                raise ImportError("openai 패키지를 설치하세요: pip install openai")
            self.client = OpenAI(api_key=api_key) if api_key else OpenAI()
        else:
            raise ValueError(f"지원하지 않는 API: {api_provider}")

    def _call_api(self, prompt: str) -> str:
        """API 호출"""
        if self.api_provider == "anthropic":
            response = self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                system=self.SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        else:  # openai
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                max_tokens=2000,
                messages=[
                    {"role": "system", "content": self.SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content

    def _parse_json_response(self, response: str) -> List[Dict]:
        """JSON 응답 파싱"""
        # JSON 블록 추출
        import re
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', response)
        if json_match:
            json_str = json_match.group(1)
        else:
            # JSON 블록이 없으면 전체를 파싱 시도
            json_str = response

        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            print(f"JSON 파싱 실패: {e}")
            return []

    def generate_qa_pairs(self, text: str, source: str) -> List[QAPair]:
        """텍스트에서 Q&A 쌍 생성"""
        prompt = self.QA_GENERATION_PROMPT.format(text=text)

        try:
            response = self._call_api(prompt)
            parsed = self._parse_json_response(response)

            pairs = []
            for item in parsed:
                pairs.append(QAPair(
                    question=item.get("question", ""),
                    answer=item.get("answer", ""),
                    source=source,
                    category=item.get("category", "기타")
                ))
            return pairs
        except Exception as e:
            print(f"Q&A 생성 실패: {e}")
            return []

    def generate_preference_pairs(self, text: str, source: str) -> List[PreferencePair]:
        """텍스트에서 선호도 쌍 생성"""
        prompt = self.PREFERENCE_GENERATION_PROMPT.format(text=text)

        try:
            response = self._call_api(prompt)
            parsed = self._parse_json_response(response)

            pairs = []
            for item in parsed:
                pairs.append(PreferencePair(
                    prompt=item.get("prompt", ""),
                    chosen=item.get("chosen", ""),
                    rejected=item.get("rejected", ""),
                    source=source
                ))
            return pairs
        except Exception as e:
            print(f"선호도 쌍 생성 실패: {e}")
            return []

    def process_chunks(
        self,
        chunks_file: str,
        output_dir: str,
        data_type: str = "both",  # "qa", "preference", "both"
        max_chunks: Optional[int] = None,
        delay: float = 1.0  # API 호출 간 대기 시간
    ):
        """추출된 청크 처리"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # 청크 데이터 로드
        with open(chunks_file, 'r', encoding='utf-8') as f:
            data = json.load(f)

        all_qa_pairs = []
        all_preference_pairs = []

        total_chunks = 0
        for file_data in data.get("files", []):
            for chunk in file_data.get("content", []):
                total_chunks += 1

        processed = 0
        for file_data in data.get("files", []):
            source = file_data.get("name", "unknown")
            chunks = file_data.get("content", [])

            for i, chunk in enumerate(chunks):
                if max_chunks and processed >= max_chunks:
                    break

                print(f"[{processed + 1}/{min(total_chunks, max_chunks or total_chunks)}] {source} - 청크 {i + 1}")

                if data_type in ["qa", "both"]:
                    qa_pairs = self.generate_qa_pairs(chunk, source)
                    all_qa_pairs.extend(qa_pairs)
                    print(f"  - Q&A 쌍 {len(qa_pairs)}개 생성")

                if data_type in ["preference", "both"]:
                    pref_pairs = self.generate_preference_pairs(chunk, source)
                    all_preference_pairs.extend(pref_pairs)
                    print(f"  - 선호도 쌍 {len(pref_pairs)}개 생성")

                processed += 1
                time.sleep(delay)  # API 레이트 리밋 방지

            if max_chunks and processed >= max_chunks:
                break

        # 결과 저장
        if all_qa_pairs:
            qa_output = output_path / "qa_pairs.json"
            with open(qa_output, 'w', encoding='utf-8') as f:
                json.dump([asdict(p) for p in all_qa_pairs], f, ensure_ascii=False, indent=2)
            print(f"\nQ&A 쌍 저장: {qa_output} ({len(all_qa_pairs)}개)")

            # SFT 형식으로도 저장 (instruction-response)
            sft_data = []
            for p in all_qa_pairs:
                sft_data.append({
                    "instruction": p.question,
                    "response": p.answer,
                    "category": p.category
                })
            sft_output = output_path / "sft_dataset.json"
            with open(sft_output, 'w', encoding='utf-8') as f:
                json.dump(sft_data, f, ensure_ascii=False, indent=2)
            print(f"SFT 데이터셋 저장: {sft_output}")

        if all_preference_pairs:
            pref_output = output_path / "preference_pairs.json"
            with open(pref_output, 'w', encoding='utf-8') as f:
                json.dump([asdict(p) for p in all_preference_pairs], f, ensure_ascii=False, indent=2)
            print(f"선호도 쌍 저장: {pref_output} ({len(all_preference_pairs)}개)")

            # DPO 형식으로도 저장
            dpo_data = []
            for p in all_preference_pairs:
                dpo_data.append({
                    "prompt": p.prompt,
                    "chosen": p.chosen,
                    "rejected": p.rejected
                })
            dpo_output = output_path / "dpo_dataset.json"
            with open(dpo_output, 'w', encoding='utf-8') as f:
                json.dump(dpo_data, f, ensure_ascii=False, indent=2)
            print(f"DPO 데이터셋 저장: {dpo_output}")

        print(f"\n완료! 총 {len(all_qa_pairs)} Q&A 쌍, {len(all_preference_pairs)} 선호도 쌍 생성")


def main():
    import argparse

    parser = argparse.ArgumentParser(description='ADHD 학습 데이터 생성')
    parser.add_argument('--chunks', '-c', required=True, help='추출된 청크 파일 경로')
    parser.add_argument('--output', '-o', default='./output', help='출력 폴더')
    parser.add_argument('--type', '-t', choices=['qa', 'preference', 'both'], default='both',
                        help='생성할 데이터 타입')
    parser.add_argument('--provider', '-p', choices=['anthropic', 'openai'], default='anthropic',
                        help='API 제공자')
    parser.add_argument('--api-key', '-k', default=None,
                        help='API 키 (환경변수 대신 직접 입력)')
    parser.add_argument('--max-chunks', '-m', type=int, default=None,
                        help='처리할 최대 청크 수 (테스트용)')
    parser.add_argument('--delay', '-d', type=float, default=1.0,
                        help='API 호출 간 대기 시간 (초)')

    args = parser.parse_args()

    generator = TrainingDataGenerator(api_provider=args.provider, api_key=args.api_key)
    generator.process_chunks(
        chunks_file=args.chunks,
        output_dir=args.output,
        data_type=args.type,
        max_chunks=args.max_chunks,
        delay=args.delay
    )


if __name__ == "__main__":
    main()
