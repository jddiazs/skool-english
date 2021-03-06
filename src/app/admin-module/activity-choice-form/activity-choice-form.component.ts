import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Validators, FormBuilder, FormArray } from '@angular/forms';
import { CoursesService } from '../services/courses.service';
import { environment } from '../../../environments/environment';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-activity-choice-form',
  templateUrl: './activity-choice-form.component.html',
  styleUrls: ['./activity-choice-form.component.scss']
})
export class ActivityChoiceFormComponent implements OnInit {

  @Input() courseId;
  @Input() position = 0;
  @Input() unitId;
  @Input() slide;
  @Output() test: EventEmitter<any> = new EventEmitter<any>();

  public typeQuestionSelected: any;
  public typesQuestions = ['Imagen y selección', 'Audio y autocompletar', 'Audio y selección', 'Imagen y autocompletar'];


  public title = 'Nueva Actividad';
  public action = 'new';
  public disableButton = false;
  public form = this.fb.group({
    name: ['', Validators.required],
    typeQuestion: [''],
    questions: this.fb.array([])
  });
  private formData: FormData[] = [];
  private formDataImage: FormData[] = [];
  private promises = [];
  private promisesImage = [];

  constructor(private fb: FormBuilder, private courseService: CoursesService, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {

    if (this.slide !== null) {
      this.title = 'Editar Actividad';
      this.action = 'edit';
      this.buildEditForm(this.slide.content);
    }
  }

  private buildEditForm(data) {
    for (const key in data.questions) {
      if (data.questions.hasOwnProperty(key)) {
        const question = data.questions[key];
        this.addQuestion(true);
        if (question.hasOwnProperty('options')) {
          for (const i in question.options) {
            if (question.options.hasOwnProperty(i)) {
              this.addAnswerForm(key);
            }
          }
        }
      }
    }
    this.form.patchValue(data);
  }

  get questions() {
    return this.form.get('questions') as FormArray;
  }

  addQuestion(skipValidation = false) {
    if (this.typeQuestionSelected === undefined && !skipValidation) {
      return;
    }
    this.questions.push(this.newQuestionForm());
  }

  newQuestionForm() {
      return this.fb.group({
        question: [''],
        typeQuestion: [this.typeQuestionSelected],
        audio: [''],
        image: [''],
        answer: ['', Validators.required],
        options: this.fb.array([])
      });

  }

  getAnswerControl(i) {
    const questionsControls = this.questions.controls[i] as FormArray;
    // tslint:disable-next-line:no-string-literal
    return questionsControls.controls['options'] as FormArray;
  }

  addAnswerForm(i) {
    const questionControls = this.questions.controls[i] as FormArray;
    const typeQuestion = questionControls['controls']['typeQuestion'];
    
    if (
      this.getAnswerControl(i).length < 4   || 
      typeQuestion === undefined
    ) {
      this.getAnswerControl(i).push(this.newAnswerForm());
    } 
  }

  newAnswerForm() {
    return this.fb.group({
      option: ['', Validators.required]
    });
  }

  sendRequest() {
    if (this.action === 'new') {
      const data = {
        course_id: this.courseId,
        unit_id: this.unitId,
        type: 'activity',
        subType: 'choice',
        position: this.position,
        content: JSON.stringify(this.form.value)
      };

      this.courseService.newSlide(data).subscribe(r => {
        this.test.emit(r);
      }, error => console.error(error));
    } else {
      const data = {
        content: JSON.stringify(this.form.value)
      };

      this.courseService.editSlide(this.slide.id, data).subscribe(r => {
        this.test.emit(r);
      }, error => console.error(error));
    }
  }

  setFormData(event, index) {
    this.formData[index] = event;
  }

  setFormDataImage(event, index) {
    this.formDataImage[index] = event;
  }

  uploadFiles() {
    for (const formData of this.formData) {
      this.promises.push(this.courseService.uploadFiles(formData).toPromise());
    }
    for (const formData of this.formDataImage) {
      this.promisesImage.push(this.courseService.uploadFiles(formData).toPromise());
    }
    return Promise.all(this.promises).then(values => {
      for (let i = 0; i < values.length; i++) {
        // tslint:disable-next-line:no-string-literal
        this.questions.controls[i]['controls']['audio'].patchValue(values[i].path);
      }
      Promise.all(this.promisesImage).then(values => {
        for (let i = 0; i < values.length; i++) {
          // tslint:disable-next-line:no-string-literal
          this.questions.controls[i]['controls']['image'].patchValue(values[i].path);
        }
        this.sendRequest();
      });
    }).catch(error => console.error(error));
  }

  onSubmit() {
    this.disableButton = true;
    if (this.formData !== null) {
      this.uploadFiles();
    } else {
      this.sendRequest();
    }
  }

  sanitizerUrl(url, addApiUrl) {
    if (addApiUrl) {
      url = `${environment.baseUrl + url}` ;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  hasAudioFile(questionIndex) {
    const questionControls = this.questions.controls[questionIndex] as FormArray;
    // tslint:disable-next-line:no-string-literal
    if (questionControls['controls']['audio'] !== undefined && questionControls['controls']['audio'] !== '') {
      // tslint:disable-next-line:no-string-literal
      return questionControls['controls']['audio'].value;
    }
    return false;
  }

  hasImageFile(questionIndex) {
    const questionControls = this.questions.controls[questionIndex] as FormArray;
    // tslint:disable-next-line:no-string-literal
    if (questionControls['controls']['image'] !== undefined && questionControls['controls']['image'] !== '') {
      // tslint:disable-next-line:no-string-literal
      return questionControls['controls']['image'].value;
    }
    return false;
  }
  showWidget(questionIndex, types: string[]) {
    const questionControls = this.questions.controls[questionIndex] as FormArray;
    // tslint:disable-next-line:no-string-literal
    if (questionControls['controls']['typeQuestion'].value === null ||  types.includes(questionControls['controls']['typeQuestion'].value) ) {
      // tslint:disable-next-line:no-string-literal
      return questionControls['controls']['typeQuestion'].value ?? true;
    }
    return false;
  }

  deleteAudio(workBankIndex, key = 'audio') {
    const questionControls = this.questions.controls[workBankIndex] as FormArray;
    // tslint:disable-next-line:no-string-literal
    if (questionControls['controls'][key] !== undefined && questionControls['controls'][key] !== '') {
      // tslint:disable-next-line:no-string-literal
      return questionControls['controls'][key].patchValue(null);
    }
  }

}
