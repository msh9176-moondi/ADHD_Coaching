"""
ADHD 코칭 AI 파인튜닝 스크립트
Unsloth + TRL을 사용한 효율적인 파인튜닝
"""

import json
import torch
from pathlib import Path

# Unsloth 설치 확인
try:
    from unsloth import FastLanguageModel
    from unsloth.chat_templates import get_chat_template
    UNSLOTH_AVAILABLE = True
except ImportError:
    UNSLOTH_AVAILABLE = False
    print("Unsloth 설치 필요:")
    print("pip install unsloth")

# TRL 설치 확인
try:
    from trl import SFTTrainer, DPOTrainer
    from transformers import TrainingArguments
    from datasets import Dataset
    TRL_AVAILABLE = True
except ImportError:
    TRL_AVAILABLE = False
    print("TRL 설치 필요:")
    print("pip install trl transformers datasets")


class ADHDCoachFineTuner:
    """ADHD 코칭 모델 파인튜너"""

    # 추천 베이스 모델들
    BASE_MODELS = {
        "qwen2-7b": "unsloth/Qwen2-7B-Instruct-bnb-4bit",      # 한국어 좋음
        "llama3-8b": "unsloth/llama-3-8b-Instruct-bnb-4bit",   # 균형 잡힘
        "mistral-7b": "unsloth/mistral-7b-instruct-v0.3-bnb-4bit",  # 빠름
        "gemma-7b": "unsloth/gemma-7b-it-bnb-4bit",            # 구글
    }

    ADHD_COACH_SYSTEM_PROMPT = """당신은 ADHD 전문 코치입니다. 피코치의 말에 공감하고,
ADHD 뇌의 특성을 이해하며, 작고 구체적인 실행 단계를 제안합니다.
완벽보다 진행을, 비판보다 격려를 우선합니다."""

    def __init__(
        self,
        base_model: str = "qwen2-7b",
        max_seq_length: int = 2048,
        load_in_4bit: bool = True
    ):
        if not UNSLOTH_AVAILABLE:
            raise ImportError("Unsloth가 필요합니다")

        model_name = self.BASE_MODELS.get(base_model, base_model)
        print(f"모델 로딩: {model_name}")

        self.model, self.tokenizer = FastLanguageModel.from_pretrained(
            model_name=model_name,
            max_seq_length=max_seq_length,
            load_in_4bit=load_in_4bit,
            dtype=None,  # 자동 감지
        )

        # LoRA 어댑터 추가
        self.model = FastLanguageModel.get_peft_model(
            self.model,
            r=16,  # LoRA rank
            lora_alpha=16,
            lora_dropout=0,
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                          "gate_proj", "up_proj", "down_proj"],
            bias="none",
            use_gradient_checkpointing="unsloth",
            random_state=42,
        )

        # 채팅 템플릿 설정
        self.tokenizer = get_chat_template(
            self.tokenizer,
            chat_template="chatml",  # 또는 "llama-3", "mistral" 등
        )

    def prepare_sft_dataset(self, data_path: str) -> Dataset:
        """SFT 데이터셋 준비"""
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        formatted_data = []
        for item in data:
            # 채팅 형식으로 변환
            conversation = [
                {"role": "system", "content": self.ADHD_COACH_SYSTEM_PROMPT},
                {"role": "user", "content": item["instruction"]},
                {"role": "assistant", "content": item["response"]}
            ]

            # 토크나이저로 포맷
            text = self.tokenizer.apply_chat_template(
                conversation,
                tokenize=False,
                add_generation_prompt=False
            )
            formatted_data.append({"text": text})

        return Dataset.from_list(formatted_data)

    def prepare_dpo_dataset(self, data_path: str) -> Dataset:
        """DPO 데이터셋 준비"""
        with open(data_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        formatted_data = []
        for item in data:
            # 프롬프트
            prompt_messages = [
                {"role": "system", "content": self.ADHD_COACH_SYSTEM_PROMPT},
                {"role": "user", "content": item["prompt"]}
            ]
            prompt = self.tokenizer.apply_chat_template(
                prompt_messages,
                tokenize=False,
                add_generation_prompt=True
            )

            formatted_data.append({
                "prompt": prompt,
                "chosen": item["chosen"],
                "rejected": item["rejected"]
            })

        return Dataset.from_list(formatted_data)

    def train_sft(
        self,
        dataset: Dataset,
        output_dir: str = "./adhd_coach_sft",
        num_epochs: int = 3,
        batch_size: int = 2,
        learning_rate: float = 2e-4,
    ):
        """SFT (Supervised Fine-Tuning) 실행"""
        if not TRL_AVAILABLE:
            raise ImportError("TRL이 필요합니다")

        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=num_epochs,
            per_device_train_batch_size=batch_size,
            gradient_accumulation_steps=4,
            learning_rate=learning_rate,
            weight_decay=0.01,
            warmup_steps=10,
            logging_steps=10,
            save_steps=100,
            fp16=not torch.cuda.is_bf16_supported(),
            bf16=torch.cuda.is_bf16_supported(),
            optim="adamw_8bit",
        )

        trainer = SFTTrainer(
            model=self.model,
            tokenizer=self.tokenizer,
            train_dataset=dataset,
            dataset_text_field="text",
            max_seq_length=2048,
            args=training_args,
        )

        print("SFT 학습 시작...")
        trainer.train()

        # 모델 저장
        self.model.save_pretrained(output_dir)
        self.tokenizer.save_pretrained(output_dir)
        print(f"모델 저장 완료: {output_dir}")

    def train_dpo(
        self,
        dataset: Dataset,
        output_dir: str = "./adhd_coach_dpo",
        num_epochs: int = 1,
        batch_size: int = 2,
        learning_rate: float = 5e-5,
        beta: float = 0.1,  # DPO 온도
    ):
        """DPO (Direct Preference Optimization) 실행"""
        if not TRL_AVAILABLE:
            raise ImportError("TRL이 필요합니다")

        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=num_epochs,
            per_device_train_batch_size=batch_size,
            gradient_accumulation_steps=4,
            learning_rate=learning_rate,
            weight_decay=0.01,
            warmup_ratio=0.1,
            logging_steps=10,
            save_steps=100,
            fp16=not torch.cuda.is_bf16_supported(),
            bf16=torch.cuda.is_bf16_supported(),
            optim="adamw_8bit",
            remove_unused_columns=False,
        )

        trainer = DPOTrainer(
            model=self.model,
            ref_model=None,  # Unsloth는 자동 처리
            args=training_args,
            train_dataset=dataset,
            tokenizer=self.tokenizer,
            beta=beta,
            max_length=2048,
            max_prompt_length=1024,
        )

        print("DPO 학습 시작...")
        trainer.train()

        # 모델 저장
        self.model.save_pretrained(output_dir)
        self.tokenizer.save_pretrained(output_dir)
        print(f"모델 저장 완료: {output_dir}")

    def export_to_gguf(self, output_dir: str, quantization: str = "q4_k_m"):
        """GGUF 포맷으로 내보내기 (llama.cpp 호환)"""
        print(f"GGUF로 내보내기: {quantization}")
        self.model.save_pretrained_gguf(
            output_dir,
            self.tokenizer,
            quantization_method=quantization
        )
        print(f"GGUF 저장 완료: {output_dir}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description='ADHD 코칭 모델 파인튜닝')
    parser.add_argument('--mode', '-m', choices=['sft', 'dpo'], required=True,
                        help='학습 모드')
    parser.add_argument('--data', '-d', required=True,
                        help='학습 데이터 경로 (JSON)')
    parser.add_argument('--base-model', '-b', default='qwen2-7b',
                        choices=['qwen2-7b', 'llama3-8b', 'mistral-7b', 'gemma-7b'],
                        help='베이스 모델')
    parser.add_argument('--output', '-o', default='./adhd_coach_model',
                        help='출력 폴더')
    parser.add_argument('--epochs', '-e', type=int, default=3,
                        help='에폭 수')
    parser.add_argument('--batch-size', type=int, default=2,
                        help='배치 크기')
    parser.add_argument('--export-gguf', action='store_true',
                        help='GGUF로 내보내기')

    args = parser.parse_args()

    # 파인튜너 초기화
    tuner = ADHDCoachFineTuner(base_model=args.base_model)

    if args.mode == 'sft':
        dataset = tuner.prepare_sft_dataset(args.data)
        tuner.train_sft(
            dataset,
            output_dir=args.output,
            num_epochs=args.epochs,
            batch_size=args.batch_size
        )
    else:  # dpo
        dataset = tuner.prepare_dpo_dataset(args.data)
        tuner.train_dpo(
            dataset,
            output_dir=args.output,
            num_epochs=args.epochs,
            batch_size=args.batch_size
        )

    if args.export_gguf:
        tuner.export_to_gguf(f"{args.output}_gguf")


if __name__ == "__main__":
    main()
